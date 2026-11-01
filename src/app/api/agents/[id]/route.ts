import { type NextRequest, NextResponse } from "next/server";
import { requireConsoleOwner } from "@/lib/console-owner";
import { createClient } from "@/lib/supabase/server";
import type { AgentRow } from "@/lib/agents/types";
import { isUuid, validateAgentPatch } from "@/lib/agents/validate";
import { log } from "@/lib/log";

/**
 * src/app/api/agents/[id]/route.ts
 *
 * GET    /api/agents/[id]   — fetch a single agent
 * PATCH  /api/agents/[id]   — update agent fields
 * DELETE /api/agents/[id]   — delete agent (and cascades runs)
 */

type Ctx = { params: Promise<{ id: string }> };

// ── shared: resolve + ownership check ─────────────────────────────────────────

async function resolveAgent(id: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  return { data: data as AgentRow | null, error };
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  const access = await requireConsoleOwner();
  if (!access.ok) return access.response;
  if (!isUuid(id)) return NextResponse.json({ error: "Not found", code: "not_found" }, { status: 404 });
  const { user } = access;

  const { data, error } = await resolveAgent(id, user.id);
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ agent: data });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  const access = await requireConsoleOwner();
  if (!access.ok) return access.response;
  if (!isUuid(id)) return NextResponse.json({ error: "Not found", code: "not_found" }, { status: 404 });
  const { user } = access;
  const supabase = await createClient();

  // Confirm ownership before updating
  const { data: existing, error: fetchErr } = await resolveAgent(id, user.id);
  if (fetchErr || !existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", code: "invalid_json" }, { status: 400 });
  }

  const parsed = validateAgentPatch(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, code: "invalid_input", field: parsed.field }, { status: 400 });
  }
  const patch: Record<string, unknown> = { ...parsed.value };

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ agent: existing });
  }

  const { data, error } = await supabase
    .from("agents")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "An agent with that name already exists." }, { status: 409 });
    }
    log.error("agents.update_failed", { code: error.code });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ agent: data as AgentRow });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  const access = await requireConsoleOwner();
  if (!access.ok) return access.response;
  if (!isUuid(id)) return NextResponse.json({ error: "Not found", code: "not_found" }, { status: 404 });
  const { user } = access;
  const supabase = await createClient();

  const { data: deleted, error } = await supabase
    .from("agents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (!error && (deleted ?? []).length === 0) {
    return NextResponse.json({ error: "Not found", code: "not_found" }, { status: 404 });
  }

  if (error) {
    log.error("agents.delete_failed", { code: error.code });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
