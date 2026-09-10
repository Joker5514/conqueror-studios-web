-- Run history for every agent execution.
-- Written by the /api/agents/[id]/run route after a Nexus call completes.

create table if not exists public.agent_runs (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null    default now(),

  -- Linkage
  agent_id        uuid        not null    references public.agents(id) on delete cascade,
  user_id         uuid        not null    references auth.users(id)    on delete cascade,

  -- Execution inputs
  input           text        not null,

  -- Execution outputs
  output          text,
  routing_mode    text,
  latency_ms      integer,
  correlation_id  text,

  -- Full Nexus trace stored as JSONB for the trace viewer
  trace           jsonb,

  -- Terminal status
  status          text        not null    default 'running'
                              check (status in ('running', 'done', 'error')),
  error           text
);

-- Fast lookup by agent (most common query: latest runs for one agent)
create index if not exists agent_runs_agent_id_idx
  on public.agent_runs (agent_id, created_at desc);

-- Fast lookup by user (for cross-agent history views)
create index if not exists agent_runs_user_id_idx
  on public.agent_runs (user_id, created_at desc);

-- RLS: users can only read runs that belong to their own agents.
alter table public.agent_runs enable row level security;

create policy "agent_runs: owner select"
  on public.agent_runs for select
  using (auth.uid() = user_id);

create policy "agent_runs: owner insert"
  on public.agent_runs for insert
  with check (auth.uid() = user_id);

-- Runs are never updated or deleted from the web tier — immutable audit log.
-- The /api/agents/[id]/run route uses the service-role client to write,
-- bypassing RLS, to avoid a round-trip permission check mid-execution.
