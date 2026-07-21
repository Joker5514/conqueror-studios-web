import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AgentRow, AgentRunRow } from "@/lib/agents/types";

/**
 * src/app/api/agents/[id]/run/route.ts
 *
 * POST /api/agents/[id]/run
 *
 * Flow:
 *   1. Auth guard + ownership check
 *   2. Load agent definition from DB
 *   3. Call OrchestrAI Nexus /run server-side (NEXUS_URL — never exposed to browser)
 *   4. Persist result to agent_runs via admin client
 *   5. Return run row + trace to caller
 *
 * Architecture rules (AGENTS.md):
 *   - NEXUS_URL must only be used in this file and /api/nexus/route.ts
 *   - Never proxy NEXUS_URL to the browser bundle
 */

const NEXUS_URL = process.env.NEXUS_URL ?? "http://localhost:8000";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;

  // ── 1. Auth guard ────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── 2. Load agent + ownership check ─────────────────────────────────────────
  const { data: agent, error: agentErr } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (agentErr || !agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const agentRow = agent as AgentRow;

  // ── 3. Parse run input ───────────────────────────────────────────────────────
  let body: { input?: string };
  try {
    body = await req.json() as { input?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.input?.trim()) {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  const correlationId = crypto.randomUUID();
  const startedAt     = Date.now();

  // ── 4. Insert a `running` run row early so we have an ID ───────────────────
  // Use admin client so RLS insert policy doesn't block server-side write.
  const admin = createAdminClient();
  const { data: runRow, error: insertErr } = await admin
    .from("agent_runs")
    .insert({
      agent_id:       id,
      user_id:        user.id,
      input:          body.input.trim(),
      status:         "running",
      correlation_id: correlationId,
    })
    .select()
    .single();

  if (insertErr || !runRow) {
    console.error("[agent/run] initial insert error", insertErr);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const run = runRow as AgentRunRow;

  // ── 5. Call Nexus ────────────────────────────────────────────────────────────
  let nexusData: Record<string, unknown>;
  try {
    const nexusRes = await fetch(`${NEXUS_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id:        user.id,
        query:          body.input.trim(),
        correlation_id: correlationId,
        context: {
          // Pass agent definition so Nexus can constrain its behaviour
          agent_id:      agentRow.id,
          agent_name:    agentRow.name,
          system_prompt: agentRow.system_prompt,
          model:         agentRow.model,
          allowed_tools: agentRow.tools.length > 0 ? agentRow.tools : null,
        },
      }),
    });

    const raw: unknown = await nexusRes.json().catch(() => ({}));
    nexusData = raw as Record<string, unknown>;

    const latencyMs = Date.now() - startedAt;
    const trace     = (nexusData.trace ?? null) as Record<string, unknown> | null;
    const result    = nexusData.result as Record<string, unknown> | undefined;
    const answer    = typeof result?.answer === "string" ? result.answer : null;
    const mode      = typeof nexusData.routing_mode === "string" ? nexusData.routing_mode : null;

    // ── 6. Update run row with result ─────────────────────────────────────────
    const { data: updatedRun, error: updateErr } = await admin
      .from("agent_runs")
      .update({
        output:       answer ?? JSON.stringify(result ?? nexusData),
        routing_mode: mode,
        latency_ms:   latencyMs,
        trace:        trace,
        status:       nexusRes.ok ? "done" : "error",
        error:        nexusRes.ok ? null : String(nexusData.error ?? "Nexus error"),
      })
      .eq("id", run.id)
      .select()
      .single();

    if (updateErr) console.error("[agent/run] update error", updateErr);

    return NextResponse.json({
      run:    (updatedRun ?? run) as AgentRunRow,
      result: nexusData,
    }, { status: nexusRes.ok ? 200 : 502 });

  } catch (err) {
    // Nexus unreachable — mark run as error
    await admin
      .from("agent_runs")
      .update({ status: "error", error: String(err) })
      .eq("id", run.id);

    return NextResponse.json(
      { error: "Nexus service unreachable", detail: String(err), run_id: run.id },
      { status: 502 },
    );
  }
}
