-- 0001_catalog — sports, competitors, venues, competitions, events.
-- Postgres 13+ (gen_random_uuid is built in).

-- ---------------------------------------------------------------------------
-- sport / format
-- ---------------------------------------------------------------------------

-- topology decides what a "segment" of a contest means, which is the only
-- sport-specific thing the log model needs to know about.
create table sport (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  topology      text not null check (topology in (
                  'timed_halves',   -- football: halves, extra time
                  'timed_periods',  -- basketball, ice hockey: quarters, periods
                  'set_based',       -- tennis, volleyball: sets
                  'innings_based',   -- cricket, baseball: innings / days
                  'round_based',     -- boxing, MMA: rounds
                  'stage_based'      -- cycling, F1 weekend: stages, sessions
                )),
  is_team_sport boolean not null default true,
  sort_order    int not null default 100,
  created_at    timestamptz not null default now()
);

-- A format is a rule variant that changes how many segments a contest has.
-- segment_count null = open ended (deciding sets, extra innings).
create table format (
  id            uuid primary key default gen_random_uuid(),
  sport_id      uuid not null references sport(id) on delete cascade,
  slug          text not null,
  name          text not null,
  segment_label text not null,
  segment_count int check (segment_count > 0),
  is_default    boolean not null default false,
  notes         text,
  unique (sport_id, slug)
);

create unique index format_one_default_per_sport
  on format (sport_id) where is_default;

-- ---------------------------------------------------------------------------
-- entity — anything that can take part in an event
-- ---------------------------------------------------------------------------

-- Clubs, national teams and individual athletes share one table because
-- event_participant has to point at all of them the same way.
-- sport_id null = multi-sport club (Fenerbahçe fields football and basketball).
create table entity (
  id           uuid primary key default gen_random_uuid(),
  sport_id     uuid references sport(id) on delete restrict,
  kind         text not null check (kind in ('club','national_team','person','pair','crew')),
  slug         text not null unique,
  display_name text not null,
  short_name   text,
  country      char(2),
  founded_year int,
  created_at   timestamptz not null default now()
);

-- Name history: a user who went in 2013 should see the 2013 name.
create table entity_name (
  id         uuid primary key default gen_random_uuid(),
  entity_id  uuid not null references entity(id) on delete cascade,
  name       text not null,
  valid_from date,
  valid_to   date,
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create index entity_name_entity_idx on entity_name (entity_id);

-- ---------------------------------------------------------------------------
-- venue
-- ---------------------------------------------------------------------------

-- A rebuilt-on-the-same-site ground is a SEPARATE venue row linked through
-- predecessor_venue_id. Ground collectors want to count them separately.
create table venue (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  display_name text not null,
  city         text,
  country      char(2),
  lat          numeric(9,6),
  lng          numeric(9,6),
  capacity     int,
  opened_year  int,
  closed_year  int,
  is_indoor    boolean,
  predecessor_venue_id uuid references venue(id) on delete set null,
  created_at   timestamptz not null default now(),
  check (closed_year is null or opened_year is null or closed_year >= opened_year)
);

create table venue_name (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references venue(id) on delete cascade,
  name       text not null,
  valid_from date,
  valid_to   date,
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create index venue_name_venue_idx on venue_name (venue_id);
create index venue_country_city_idx on venue (country, city);

-- ---------------------------------------------------------------------------
-- competition / season
-- ---------------------------------------------------------------------------

create table competition (
  id           uuid primary key default gen_random_uuid(),
  sport_id     uuid not null references sport(id) on delete restrict,
  slug         text not null unique,
  display_name text not null,
  kind         text not null check (kind in ('league','cup','tournament','international','exhibition','friendly')),
  country      char(2),  -- null = international / continental
  tier         int,
  created_at   timestamptz not null default now()
);

create table season (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competition(id) on delete cascade,
  slug           text not null,
  label          text not null,   -- '2025-26', '2026', 'Wimbledon 2025'
  starts_on      date,
  ends_on        date,
  unique (competition_id, slug)
);

-- ---------------------------------------------------------------------------
-- event
-- ---------------------------------------------------------------------------

create table event (
  id             uuid primary key default gen_random_uuid(),
  sport_id       uuid not null references sport(id) on delete restrict,
  competition_id uuid references competition(id) on delete set null,
  season_id      uuid references season(id) on delete set null,
  format_id      uuid references format(id) on delete set null,

  -- venue is the event's own column, never derived from the home side:
  -- bans, renovations, ground shares and neutral finals all break that shortcut.
  venue_id            uuid references venue(id) on delete set null,
  is_neutral_venue    boolean not null default false,
  behind_closed_doors boolean not null default false,

  slug           text not null unique,
  title          text,   -- for named one-offs: 'Ali vs Frazier III'
  stage          text,   -- 'Final', 'Round of 16', 'Matchday 12'

  starts_at      timestamptz,
  -- Historical events often only have a date, or just a year.
  starts_at_precision text not null default 'minute'
                 check (starts_at_precision in ('minute','day','month','year')),
  ends_on        date,   -- multi-day events (Test cricket, tournaments)

  status         text not null default 'scheduled'
                 check (status in ('scheduled','live','finished','postponed','cancelled','abandoned')),

  -- How many segments the contest ACTUALLY had. A best-of-five that ended 3-0
  -- has 3, not 5 — coverage maths needs the real number, not the format's max.
  segment_count_actual int check (segment_count_actual > 0),

  -- Marks the classics catalogue: Istanbul 2005, Brazil 1-7, Ali-Frazier.
  is_canonical   boolean not null default false,

  external_ids   jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (ends_on is null or starts_at is null or ends_on >= starts_at::date)
);

create index event_starts_at_idx on event (starts_at desc);
create index event_sport_starts_idx on event (sport_id, starts_at desc);
create index event_venue_idx on event (venue_id);
create index event_competition_season_idx on event (competition_id, season_id);
create index event_canonical_idx on event (is_canonical) where is_canonical;

create table event_participant (
  event_id     uuid not null references event(id) on delete cascade,
  entity_id    uuid not null references entity(id) on delete restrict,
  side         smallint not null check (side between 1 and 8),
  score        int,
  -- Per-segment detail stays loose on purpose: {"sets": [[6,4],[3,6],[7,6]]}
  score_detail jsonb,
  outcome      text check (outcome in ('win','loss','draw','walkover','retired','no_result')),
  primary key (event_id, entity_id)
);

create index event_participant_entity_idx on event_participant (entity_id);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger event_touch_updated_at
  before update on event
  for each row execute function touch_updated_at();
