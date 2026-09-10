import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AgentRunRow } from "@/lib/agents/types";

/**
 * src/app/api/agents/[id]/runs/route.ts
 *
 * GET /api/agents/[id]/runs — paginated run history for one agent
 */

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership by joining through agents RLS
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const limit  = Math.min(Number(url.searchParams.get("limit")  ?? "20"), 100);
  const offset = Math.max(Number(url.searchParams.get("offset") ?? "0"),  0);

  const { data, error, count } = await supabase
    .from("agent_runs")
    .select("*", { count: "exact" })
    .eq("agent_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("[agent_runs] list error", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({
    runs:  (data ?? []) as AgentRunRow[],
    total: count ?? 0,
  });
}
