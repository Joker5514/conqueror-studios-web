import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * src/app/api/agents/[id]/run-count/route.ts
 *
 * GET /api/agents/[id]/run-count
 * Returns the total number of completed runs for a single agent.
 * Lightweight — used for badges on the list page.
 */

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { count, error } = await supabase
    .from("agent_runs")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", id);

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
