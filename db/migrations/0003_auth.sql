-- 0003_auth — email/password sign-in with our own session table.
--
-- No auth library: app_user and handle rules are ours already, and an adapter
-- would push its own tables into the schema. Social sign-in can be added later
-- as another row in an `identity` table without touching this.

alter table app_user
  alter column email set not null,
  add column password_hash text,
  add column email_verified_at timestamptz;

-- Case-insensitive lookup: nobody remembers whether they signed up as
-- Burkay@… or burkay@…, and two accounts differing only in case is a bug.
-- The constraint has to go before its index — `drop index` on a
-- constraint-backed index is refused.
alter table app_user drop constraint if exists app_user_email_key;
create unique index app_user_email_lower_idx on app_user (lower(email));

create table session (
  id uuid primary key default gen_random_uuid(),

  -- The raw token only ever exists in the cookie. We store its hash, so a
  -- leaked database dump does not hand over live sessions.
  token_hash text not null unique,

  user_id      uuid not null references app_user(id) on delete cascade,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at   timestamptz not null,
  user_agent   text,
  ip           inet,

  check (expires_at > created_at)
);

create index session_user_idx on session (user_id);
create index session_expires_idx on session (expires_at);
