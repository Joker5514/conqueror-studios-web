import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * src/app/api/nexus/schema/route.ts
 *
 * Proxies GET /tools/schema from ai_bridge.
 * Used by the console tool registry table via useNexusSchema().
 */

const BRIDGE_URL = process.env.BRIDGE_URL ?? "http://localhost:8001";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const res = await fetch(`${BRIDGE_URL}/tools/schema`);
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "AI Bridge unreachable", detail: String(err) },
      { status: 502 },
    );
  }
}
