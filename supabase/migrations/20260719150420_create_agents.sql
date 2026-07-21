-- Agent definitions created by users in the Agent Studio console.
-- Each agent captures a name, role description, system prompt, model
-- preference, and an optional list of allowed AI Bridge tool names.

create table if not exists public.agents (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null    default now(),
  updated_at    timestamptz not null    default now(),

  -- Owner — references Supabase auth user
  user_id       uuid        not null    references auth.users(id) on delete cascade,

  -- Identity
  name          text        not null,
  description   text,

  -- Behaviour
  system_prompt text        not null    default '',
  model         text        not null    default 'gpt-4o',

  -- Tool allowlist — empty array means all tools permitted
  tools         text[]      not null    default '{}',

  -- Lifecycle
  status        text        not null    default 'draft'
                            check (status in ('draft', 'active', 'archived'))
);

-- Fast lookup by owner
create index if not exists agents_user_id_idx on public.agents (user_id);

-- Prevent duplicate names per user
create unique index if not exists agents_user_name_idx on public.agents (user_id, name);

-- Auto-bump updated_at
create trigger agents_set_updated_at
  before update on public.agents
  for each row execute procedure public.set_updated_at();

-- RLS: users can only see and modify their own agents.
alter table public.agents enable row level security;

create policy "agents: owner select"
  on public.agents for select
  using (auth.uid() = user_id);

create policy "agents: owner insert"
  on public.agents for insert
  with check (auth.uid() = user_id);

create policy "agents: owner update"
  on public.agents for update
  using (auth.uid() = user_id);

create policy "agents: owner delete"
  on public.agents for delete
  using (auth.uid() = user_id);
