/**
 * src/lib/agents/types.ts
 *
 * Shared TypeScript types for agent definitions and run history.
 * These mirror the Supabase `agents` and `agent_runs` table schemas.
 * Import from here rather than re-declaring inline across routes and hooks.
 */

export interface AgentRow {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  model: string;
  tools: string[];
  status: "draft" | "active" | "archived";
}

export interface AgentRunRow {
  id: string;
  created_at: string;
  agent_id: string;
  user_id: string;
  input: string;
  output: string | null;
  routing_mode: string | null;
  latency_ms: number | null;
  correlation_id: string | null;
  trace: Record<string, unknown> | null;
  status: "running" | "done" | "error";
  error: string | null;
}
