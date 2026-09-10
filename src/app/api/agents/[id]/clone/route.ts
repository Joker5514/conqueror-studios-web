import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AgentRow } from "@/lib/agents/types";

/**
 * src/app/api/agents/[id]/clone/route.ts
 *
 * POST /api/agents/[id]/clone
 * Duplicates an agent definition owned by the current user.
 * Body: { name?: string }  — defaults to "Copy of <original name>"
 */

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Load source agent (must be owned by this user)
  const { data: source, error: srcErr } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (srcErr || !source) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const original = source as AgentRow;

  // Determine clone name
  let cloneName: string;
  try {
    const body = await req.json() as { name?: unknown };
    cloneName = typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : `Copy of ${original.name}`;
  } catch {
    cloneName = `Copy of ${original.name}`;
  }

  // Insert clone
  const { data, error } = await supabase
    .from("agents")
    .insert({
      user_id:       user.id,
      name:          cloneName,
      description:   original.description,
      system_prompt: original.system_prompt,
      model:         original.model,
      tools:         original.tools,
      status:        "draft",          // clones always start as draft
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: `An agent named "${cloneName}" already exists.` },
        { status: 409 },
      );
    }
    console.error("[agents/clone] error", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ agent: data as AgentRow }, { status: 201 });
}
