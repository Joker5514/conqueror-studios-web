import { type NextRequest, NextResponse } from "next/server";
import { requireConsoleOwner } from "@/lib/console-owner";
import { postNexusRun } from "@/lib/nexus-client";
import { rateLimit } from "@/lib/rateLimit";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AgentRow, AgentRunRow } from "@/lib/agents/types";
import { isUuid, validateRunInput } from "@/lib/agents/validate";
import { log } from "@/lib/log";
import { isDatabaseConfigured } from "@/lib/service-config";

/**
 * src/app/api/agents/[id]/run/route.ts
 *
 * POST /api/agents/[id]/run
 *
 * Flow:
 *   1. Owner allowlist + session
 *   2. Load the caller-owned agent definition
 *   3. Call OrchestrAI Nexus /run through the server-side client
 *   4. Persist the buffered JSON result to agent_runs
 *
 * The website consumes the JSON /run contract. Chunked transfer encoding
 * is not treated as a token stream.
 */

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;

  const access = await requireConsoleOwner();
  if (!access.ok) return access.response;
  if (!isUuid(id)) return NextResponse.json({ error: "Agent not found", code: "not_found" }, { status: 404 });
  const { user } = access;

  const limit = rateLimit(`agent-run:${user.id}`, { windowMs: 60_000, max: 10 });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests", code: "rate_limited" }, { status: 429 });
  }

  const supabase = await createClient();
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

  let body: { input?: unknown };
  try {
    body = (await req.json()) as { input?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", code: "invalid_json" }, { status: 400 });
  }

  const inputResult = validateRunInput(body?.input);
  if (!inputResult.ok) {
    return NextResponse.json({ error: inputResult.error, code: "invalid_input", field: "input" }, { status: 400 });
  }
  const input = inputResult.value;

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Run history storage is not configured", code: "database_unconfigured" },
      { status: 503 },
    );
  }

  const correlationId = req.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const startedAt = Date.now();

  const admin = createAdminClient();
  const { data: runRow, error: insertErr } = await admin
    .from("agent_runs")
    .insert({
      agent_id: id,
      user_id: user.id,
      input,
      status: "running",
      correlation_id: correlationId,
    })
    .select()
    .single();

  if (insertErr || !runRow) {
    log.error("agent_run.insert_failed", { code: insertErr?.code });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const run = runRow as AgentRunRow;
  const result = await postNexusRun({
    user_id: user.id,
    query: input,
    correlation_id: correlationId,
    context: {
      agent_id: agentRow.id,
      agent_name: agentRow.name,
      system_prompt: agentRow.system_prompt,
      model: agentRow.model,
      // Deny by default: an empty list grants no tools.
      allowed_tools: agentRow.tools,
    },
  });

  const latencyMs = Date.now() - startedAt;

  if (!result.ok) {
    await admin
      .from("agent_runs")
      .update({
        status: "error",
        error: result.error,
        latency_ms: latencyMs,
      })
      .eq("id", run.id);
    return NextResponse.json(
      { error: result.error, code: result.code, run_id: run.id },
      { status: result.status },
    );
  }

  const nexusData = (result.data && typeof result.data === "object" && !Array.isArray(result.data)
    ? result.data
    : {}) as Record<string, unknown>;
  const trace = (nexusData.trace ?? null) as Record<string, unknown> | null;
  const nexusResult = nexusData.result as Record<string, unknown> | undefined;
  const answer = typeof nexusResult?.answer === "string" ? nexusResult.answer : null;
  const mode = typeof nexusData.routing_mode === "string" ? nexusData.routing_mode : null;
  const upstreamOk = result.status >= 200 && result.status < 300;

  const { data: updatedRun, error: updateErr } = await admin
    .from("agent_runs")
    .update({
      output: answer ?? JSON.stringify(nexusResult ?? nexusData),
      routing_mode: mode,
      latency_ms: latencyMs,
      trace,
      status: upstreamOk ? "done" : "error",
      error: upstreamOk ? null : "Nexus error",
    })
    .eq("id", run.id)
    .select()
    .single();

  if (updateErr) log.error("agent_run.update_failed", { code: updateErr.code, run_id: run.id });

  return NextResponse.json({
    run: (updatedRun ?? run) as AgentRunRow,
    result: nexusData,
  }, { status: upstreamOk ? 200 : 502 });
}
