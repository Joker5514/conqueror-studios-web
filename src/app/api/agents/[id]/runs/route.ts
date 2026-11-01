import { type NextRequest, NextResponse } from "next/server";
import { requireConsoleOwner } from "@/lib/console-owner";
import { createClient } from "@/lib/supabase/server";
import type { AgentRunRow } from "@/lib/agents/types";
import { isUuid, parseBoundedInt } from "@/lib/agents/validate";
import { log } from "@/lib/log";

/**
 * src/app/api/agents/[id]/runs/route.ts
 *
 * GET /api/agents/[id]/runs — paginated run history for one agent
 */

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx): Promise<NextResponse> {
  const { id } = await ctx.params;
  const access = await requireConsoleOwner();
  if (!access.ok) return access.response;
  if (!isUuid(id)) return NextResponse.json({ error: "Not found", code: "not_found" }, { status: 404 });
  const { user } = access;
  const supabase = await createClient();

  // Verify ownership by joining through agents RLS
  const { data: agent } = await supabase
    .from("agents")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(req.url);
  const limit = parseBoundedInt(url.searchParams.get("limit"), 20, 1, 100);
  const offset = parseBoundedInt(url.searchParams.get("offset"), 0, 0, 100_000);

  const { data, error, count } = await supabase
    .from("agent_runs")
    .select("*", { count: "exact" })
    .eq("agent_id", id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    log.error("agent_runs.list_failed", { code: error.code });
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({
    runs:  (data ?? []) as AgentRunRow[],
    total: count ?? 0,
  });
}
