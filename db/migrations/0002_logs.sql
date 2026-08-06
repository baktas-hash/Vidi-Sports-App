-- 0002_logs — users, logs, coverage, social graph.

-- ---------------------------------------------------------------------------
-- app_user
-- ---------------------------------------------------------------------------

create table app_user (
  id           uuid primary key default gen_random_uuid(),
  handle       text not null unique check (handle ~ '^[a-z0-9_]{2,24}$'),
  display_name text,
  email        text unique,
  bio          text,
  country      char(2),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- log — the core action: I watched this, here is my rating and review
-- ---------------------------------------------------------------------------

create table log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references app_user(id) on delete cascade,
  event_id   uuid not null references event(id) on delete cascade,

  medium     text not null check (medium in ('stadium','tv','stream','radio','highlights','replay')),
  watched_on date not null,

  -- Half-star ratings stored as 1..10 so the column stays integer:
  -- 1 = 0.5 stars, 10 = 5 stars. See packages/shared/src/rating.ts.
  rating     smallint check (rating between 1 and 10),
  -- Kept separate from rating on purpose: at a ground the football and the
  -- atmosphere are two different verdicts ("football 2, atmosphere 5").
  atmosphere smallint check (atmosphere between 1 and 10),

  review        text,
  has_spoilers  boolean not null default false,
  -- false = watched after the fact, already knowing the result.
  is_live_watch boolean not null default true,
  is_rewatch    boolean not null default false,

  -- Free text for stadium logs: block / row / seat, ticket stub note.
  ticket_ref text,

  visibility text not null default 'public'
             check (visibility in ('public','followers','private')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One log per event per day; a genuine rewatch lands on another date.
  unique (user_id, event_id, watched_on)
);

create index log_user_created_idx on log (user_id, created_at desc);
create index log_event_idx on log (event_id);
create index log_rating_idx on log (event_id, rating) where rating is not null;
create index log_stadium_idx on log (user_id) where medium = 'stadium';

create trigger log_touch_updated_at
  before update on log
  for each row execute function touch_updated_at();

-- Postgres cannot express a cross-table CHECK, so this is a trigger.
-- The rule is one-directional: you cannot watch something before it happened.
-- There is deliberately no upper bound — logging a 1970 final today is normal.
create or replace function log_watched_on_not_before_event() returns trigger
language plpgsql as $$
declare
  event_day date;
begin
  select coalesce(e.starts_at::date, make_date(1800, 1, 1))
    into event_day
    from event e where e.id = new.event_id;

  if new.watched_on < event_day then
    raise exception 'watched_on % is before the event date %', new.watched_on, event_day
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger log_watched_on_check
  before insert or update of watched_on, event_id on log
  for each row execute function log_watched_on_not_before_event();

-- ---------------------------------------------------------------------------
-- log_segment — which parts of the contest were actually seen
-- ---------------------------------------------------------------------------

-- Storing segments individually rather than a percentage is what buys us
-- "did they see the ending?" — in sport nearly all the drama is at the end.
-- No rows at all = watched the whole thing (the common case).
create table log_segment (
  log_id        uuid not null references log(id) on delete cascade,
  segment_index smallint not null check (segment_index > 0),
  primary key (log_id, segment_index)
);

create view log_coverage as
select
  l.id as log_id,
  l.user_id,
  l.event_id,
  seen.segments_seen,
  coalesce(e.segment_count_actual, f.segment_count) as segments_total,
  case
    when seen.segments_seen = 0 then 1.0
    when coalesce(e.segment_count_actual, f.segment_count) is null then null
    else least(1.0, seen.segments_seen::numeric
                    / coalesce(e.segment_count_actual, f.segment_count))
  end as coverage_fraction,
  case
    when seen.segments_seen = 0 then true
    when coalesce(e.segment_count_actual, f.segment_count) is null then null
    else seen.last_segment = coalesce(e.segment_count_actual, f.segment_count)
  end as saw_ending,
  -- Contiguous run or channel-hopping? Cheap to derive, useful in the UI.
  case
    when seen.segments_seen = 0 then false
    else seen.segments_seen <> (seen.last_segment - seen.first_segment + 1)
  end as is_fragmented
from log l
join event e on e.id = l.event_id
left join format f on f.id = e.format_id
cross join lateral (
  select
    count(*)::int                      as segments_seen,
    min(s.segment_index)::int          as first_segment,
    max(s.segment_index)::int          as last_segment
  from log_segment s where s.log_id = l.id
) seen;

-- ---------------------------------------------------------------------------
-- social graph
-- ---------------------------------------------------------------------------

create table follow (
  follower_id uuid not null references app_user(id) on delete cascade,
  followee_id uuid not null references app_user(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follow_followee_idx on follow (followee_id);

create table log_like (
  log_id     uuid not null references log(id) on delete cascade,
  user_id    uuid not null references app_user(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (log_id, user_id)
);

create table comment (
  id         uuid primary key default gen_random_uuid(),
  log_id     uuid not null references log(id) on delete cascade,
  user_id    uuid not null references app_user(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comment_log_idx on comment (log_id, created_at);

create trigger comment_touch_updated_at
  before update on comment
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- lists — the collection side (92 Club, "grounds I've been to", top tens)
-- ---------------------------------------------------------------------------

create table list (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references app_user(id) on delete cascade, -- null = editorial
  slug        text not null,
  title       text not null,
  description text,
  is_ranked   boolean not null default false,
  visibility  text not null default 'public'
              check (visibility in ('public','followers','private')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index list_user_slug_idx
  on list (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

create table list_item (
  list_id  uuid not null references list(id) on delete cascade,
  position int not null,
  -- A list holds one kind of thing at a time, enforced below.
  event_id uuid references event(id) on delete cascade,
  venue_id uuid references venue(id) on delete cascade,
  note     text,
  primary key (list_id, position),
  check (num_nonnulls(event_id, venue_id) = 1)
);

create unique index list_item_event_idx on list_item (list_id, event_id) where event_id is not null;
create unique index list_item_venue_idx on list_item (list_id, venue_id) where venue_id is not null;

create trigger list_touch_updated_at
  before update on list
  for each row execute function touch_updated_at();
