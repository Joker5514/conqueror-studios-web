"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AgentRow, AgentRunRow } from "@/lib/agents/types";

/**
 * src/hooks/api/useAgents.ts
 *
 * React Query hooks for the /api/agents route family.
 * All console agent UI must consume these hooks — no raw fetch in components.
 */

// ── Fetch helpers (private to this module) ────────────────────────────────────

async function fetchAgents(): Promise<AgentRow[]> {
  const res = await fetch("/api/agents");
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Failed to load agents: ${res.status}`);
  }
  const data = await res.json() as { agents: AgentRow[] };
  return data.agents;
}

async function fetchAgent(id: string): Promise<AgentRow> {
  const res = await fetch(`/api/agents/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Failed to load agent: ${res.status}`);
  }
  const data = await res.json() as { agent: AgentRow };
  return data.agent;
}

async function fetchAgentRuns(
  id: string,
  limit = 20,
  offset = 0,
): Promise<{ runs: AgentRunRow[]; total: number }> {
  const res = await fetch(`/api/agents/${id}/runs?limit=${limit}&offset=${offset}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Failed to load runs: ${res.status}`);
  }
  return res.json() as Promise<{ runs: AgentRunRow[]; total: number }>;
}

// ── Mutation helpers ──────────────────────────────────────────────────────────

async function createAgent(body: {
  name: string;
  description?: string;
  system_prompt?: string;
  model?: string;
  tools?: string[];
}): Promise<AgentRow> {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Create failed: ${res.status}`);
  }
  const data = await res.json() as { agent: AgentRow };
  return data.agent;
}

async function updateAgent(
  id: string,
  patch: Partial<Omit<AgentRow, "id" | "created_at" | "updated_at" | "user_id">>,
): Promise<AgentRow> {
  const res = await fetch(`/api/agents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Update failed: ${res.status}`);
  }
  const data = await res.json() as { agent: AgentRow };
  return data.agent;
}

async function deleteAgent(id: string): Promise<void> {
  const res = await fetch(`/api/agents/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Delete failed: ${res.status}`);
  }
}

async function runAgent(
  id: string,
  input: string,
): Promise<{ run: AgentRunRow; result: Record<string, unknown> }> {
  const res = await fetch(`/api/agents/${id}/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Run failed: ${res.status}`);
  }
  return res.json() as Promise<{ run: AgentRunRow; result: Record<string, unknown> }>;
}

// ── Public hooks ──────────────────────────────────────────────────────────────

/** List all agents for the current user. */
export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn:  fetchAgents,
    staleTime: 30_000,
  });
}

/** Fetch a single agent by id. */
export function useAgent(id: string) {
  return useQuery({
    queryKey: ["agents", id],
    queryFn:  () => fetchAgent(id),
    enabled:  Boolean(id),
    staleTime: 30_000,
  });
}

/** Paginated run history for one agent. */
export function useAgentRuns(id: string, limit = 20, offset = 0) {
  return useQuery({
    queryKey: ["agents", id, "runs", limit, offset],
    queryFn:  () => fetchAgentRuns(id, limit, offset),
    enabled:  Boolean(id),
    staleTime: 15_000,
  });
}

/** Create a new agent. Invalidates the agents list on success. */
export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createAgent,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["agents"] }); },
  });
}

/** Update an agent's fields. Invalidates both list and detail. */
export function useUpdateAgent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Parameters<typeof updateAgent>[1]) => updateAgent(id, patch),
    onSuccess: (updated) => {
      qc.setQueryData(["agents", id], updated);
      void qc.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

/** Delete an agent. Invalidates the agents list. */
export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAgent,
    onSuccess: (_v, deletedId) => {
      qc.removeQueries({ queryKey: ["agents", deletedId] });
      void qc.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

/** Run an agent with the given input. Invalidates run history on success. */
export function useRunAgent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: string) => runAgent(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["agents", id, "runs"] });
    },
  });
}

// ── Clone ─────────────────────────────────────────────────────────────────────

async function cloneAgent(id: string, name?: string): Promise<AgentRow> {
  const res = await fetch(`/api/agents/${id}/clone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `Clone failed: ${res.status}`);
  }
  const data = await res.json() as { agent: AgentRow };
  return data.agent;
}

async function fetchRunCount(id: string): Promise<number> {
  const res = await fetch(`/api/agents/${id}/run-count`);
  if (!res.ok) return 0;
  const data = await res.json() as { count: number };
  return data.count;
}

/** Clone an agent. Invalidates the agents list on success. */
export function useCloneAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) => cloneAgent(id, name),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["agents"] }); },
  });
}

/** Fetch the total run count for one agent. */
export function useAgentRunCount(id: string) {
  return useQuery({
    queryKey: ["agents", id, "run-count"],
    queryFn:  () => fetchRunCount(id),
    enabled:  Boolean(id),
    staleTime: 30_000,
  });
}
