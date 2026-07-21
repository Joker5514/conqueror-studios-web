import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AgentRow } from "@/lib/agents/types";

/**
 * src/app/api/agents/route.ts
 *
 * GET  /api/agents        — list all agents owned by the authenticated user
 * POST /api/agents        — create a new agent definition
 */

// ── GET — list ────────────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[agents] list error", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ agents: (data ?? []) as AgentRow[] });
}

// ── POST — create ─────────────────────────────────────────────────────────────

interface CreateAgentBody {
  name: string;
  description?: string;
  system_prompt?: string;
  model?: string;
  tools?: string[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Partial<CreateAgentBody>;
  try {
    body = await req.json() as Partial<CreateAgentBody>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("agents")
    .insert({
      user_id:       user.id,
      name:          body.name.trim(),
      description:   body.description?.trim() ?? null,
      system_prompt: body.system_prompt?.trim() ?? "",
      model:         body.model?.trim() ?? "gpt-4o",
      tools:         body.tools ?? [],
      status:        "draft",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "An agent with that name already exists." },
        { status: 409 },
      );
    }
    console.error("[agents] create error", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ agent: data as AgentRow }, { status: 201 });
}
