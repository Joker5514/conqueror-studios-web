import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * src/app/api/console/waitlist/route.ts
 *
 * Returns waitlist signups for the owner console.
 * Auth-gated: requires an active Supabase session.
 * Reads via the service-role client to bypass RLS.
 *
 * GET /api/console/waitlist?limit=100&offset=0
 * → { rows: WaitlistRow[], total: number }
 */

export interface WaitlistRow {
  id: string;
  created_at: string;
  email: string;
  name: string | null;
  org: string | null;
  interests: string[] | null;
  message: string | null;
}

const DEFAULT_LIMIT = 100;

export async function GET(req: NextRequest): Promise<NextResponse> {
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Pagination ──────────────────────────────────────────────────────────────
  const { searchParams } = req.nextUrl;
  const limit = Math.min(Number(searchParams.get("limit") ?? DEFAULT_LIMIT), 500);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

  // ── Query via admin client (bypasses RLS) ───────────────────────────────────
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!hasServiceKey) {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 503 });
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();

    const { data: rows, error, count } = await admin
      .from("waitlist")
      .select("id, created_at, email, name, org, interests, message", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[waitlist api] query error", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ rows: rows ?? [], total: count ?? 0 });
  } catch (err) {
    console.error("[waitlist api] unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
