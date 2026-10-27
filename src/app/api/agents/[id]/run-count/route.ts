import { type NextRequest, NextResponse } from "next/server";
import { requireConsoleOwner } from "@/lib/console-owner";
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
  const access = await requireConsoleOwner();
  if (!access.ok) return access.response;
  const { user } = access;
  const supabase = await createClient();

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
