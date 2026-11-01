import { type NextRequest, NextResponse } from "next/server";
import { requireConsoleOwner } from "@/lib/console-owner";
import { createClient } from "@/lib/supabase/server";
import type { AgentRow } from "@/lib/agents/types";
import { validateAgentCreate } from "@/lib/agents/validate";
import { log } from "@/lib/log";

/**
 * src/app/api/agents/route.ts
 *
 * GET  /api/agents        — list all agents owned by the authenticated user
 * POST /api/agents        — create a new agent definition
 */

// ── GET — list ────────────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  const access = await requireConsoleOwner();
  if (!access.ok) return access.response;
  const { user } = access;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    log.error("agents.list_failed", { code: error.code });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ agents: (data ?? []) as AgentRow[] });
}

// ── POST — create ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const access = await requireConsoleOwner();
  if (!access.ok) return access.response;
  const { user } = access;
  const supabase = await createClient();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body", code: "invalid_json" }, { status: 400 });
  }

  const parsed = validateAgentCreate(body, "gpt-4o");
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, code: "invalid_input", field: parsed.field }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("agents")
    .insert({
      user_id: user.id,
      ...parsed.value,
      status: "draft",
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
    log.error("agents.create_failed", { code: error.code });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ agent: data as AgentRow }, { status: 201 });
}
