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

-- Enable RLS to deny all direct public access. The server action inserts
-- via the service-role key, which bypasses RLS, so no explicit policies
-- are needed here.
alter table public.waitlist enable row level security;
