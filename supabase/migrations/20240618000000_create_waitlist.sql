-- Waitlist signups collected via the /waitlist page.
create table if not exists public.waitlist (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null    default now(),
  email       text        not null,
  name        text,
  org         text,
  interests   text[],
  message     text
);

-- Unique on email so duplicate submissions silently upsert rather than error.
create unique index if not exists waitlist_email_idx on public.waitlist (email);

-- No row-level security — inserts come from the server action using the
-- service-role key, so RLS would be bypassed anyway.
alter table public.waitlist enable row level security;
