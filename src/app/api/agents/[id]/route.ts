import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AgentRow } from "@/lib/agents/types";

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await resolveAgent(id, user.id);
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ agent: data });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

interface PatchAgentBody {
  name?: string;
  description?: string;
  system_prompt?: string;
  model?: string;
  tools?: string[];
  status?: "draft" | "active" | "archived";
}

export async function PATCH(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Confirm ownership before updating
  const { data: existing, error: fetchErr } = await resolveAgent(id, user.id);
  if (fetchErr || !existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: Partial<PatchAgentBody>;
  try {
    body = await req.json() as Partial<PatchAgentBody>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Build partial update — only include fields that were sent
  const patch: Record<string, unknown> = {};
  if (body.name          !== undefined) patch.name          = body.name.trim();
  if (body.description   !== undefined) patch.description   = body.description?.trim() ?? null;
  if (body.system_prompt !== undefined) patch.system_prompt = body.system_prompt;
  if (body.model         !== undefined) patch.model         = body.model.trim();
  if (body.tools         !== undefined) patch.tools         = body.tools;
  if (body.status        !== undefined) patch.status        = body.status;

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
    console.error("[agents] patch error", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ agent: data as AgentRow });
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("agents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[agents] delete error", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
