"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

/**
 * src/hooks/api/useNexus.ts
 *
 * React Query hooks for the /api/nexus proxy.
 *
 * Architecture rule (AGENTS.md):
 *   "Use React Query for all console data fetching.
 *    No raw fetch in components."
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface NexusTrace {
  correlation_id: string;
  routing_mode: string;
  routing_rationale: string;
  tool_invoked: string | null;
  bridge_latency_ms: number;
  total_latency_ms: number;
  model_tokens: Record<string, unknown>;
  error: string | null;
}

export interface NexusRunResult {
  correlation_id: string;
  routing_mode: string;
  result: {
    answer?: string;
    data?: unknown[];
    tool?: string;
    status?: string;
    diff?: string;
    [key: string]: unknown;
  };
  trace: NexusTrace;
}

export interface ToolDefinition {
  name: string;
  description: string;
  risk: string;
  requires_approval: boolean;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
}

// ── POST /api/nexus — run a query ─────────────────────────────────────────────

async function postNexusRun(params: {
  query: string;
  context?: Record<string, unknown>;
}): Promise<NexusRunResult> {
  const res = await fetch("/api/nexus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ?? `Nexus returned ${res.status}`,
    );
  }
  return res.json() as Promise<NexusRunResult>;
}

export function useNexusRun() {
  return useMutation({
    mutationFn: postNexusRun,
  });
}

// ── GET /api/nexus/schema — tool registry ─────────────────────────────────────

async function fetchNexusSchema(): Promise<ToolDefinition[]> {
  const res = await fetch("/api/nexus/schema");
  if (!res.ok) throw new Error(`Schema fetch failed: ${res.status}`);
  return res.json() as Promise<ToolDefinition[]>;
}

export function useNexusSchema() {
  return useQuery({
    queryKey: ["nexus", "schema"],
    queryFn: fetchNexusSchema,
    staleTime: 60_000, // refresh every minute
  });
}
