-- Stripe subscription state synced by the webhook handler.
-- Keyed on stripe_subscription_id; user identified by email (matches waitlist).

create table if not exists public.subscriptions (
  id                    uuid        primary key default gen_random_uuid(),
  created_at            timestamptz not null    default now(),
  updated_at            timestamptz not null    default now(),

  -- Stripe identifiers
  stripe_customer_id    text        not null,
  stripe_subscription_id text       not null unique,

  -- User linkage
  user_id               uuid        references auth.users(id) on delete set null,
  email                 text,

  -- Subscription state
  status                text        not null,   -- active | past_due | canceled | trialing | …
  plan                  text,                   -- price ID or human-readable plan name
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean     not null    default false
);

-- Lookup by Stripe customer ID (used in webhook handlers)
create index if not exists subscriptions_stripe_customer_id_idx
  on public.subscriptions (stripe_customer_id);

-- Lookup by user ID
create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);

-- Auto-update updated_at on any row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

-- RLS: deny all direct public access.
-- Webhook handler inserts/updates via service-role key (bypasses RLS).
alter table public.subscriptions enable row level security;
