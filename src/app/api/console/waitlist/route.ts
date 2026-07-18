import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * src/app/api/console/waitlist/route.ts
 *
 * Returns waitlist signups for the owner console.
 * Auth-gated: requires an active Supabase session.
 * When CONSOLE_OWNER_EMAILS is set, only those emails may read the list.
 * Reads via the service-role client to bypass RLS.
 *
 * GET /api/console/waitlist?limit=100&offset=0
 *  { rows: WaitlistRow[], total: number }
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
const MAX_LIMIT = 500;

function isOwnerEmail(email: string | undefined): boolean {
  const raw = process.env.CONSOLE_OWNER_EMAILS?.trim();
  if (!raw) return true;
  if (!email) return false;
  const allowed = raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  if (value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return fallback;
  return Math.min(n, max);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isOwnerEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const limit = parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);
  // offset can be large but must be a non-negative integer
  const offset = parsePositiveInt(searchParams.get("offset"), 0, Number.MAX_SAFE_INTEGER);
  // Enforce a sane floor for limit (at least 1)
  const safeLimit = Math.max(1, limit);

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
      .range(offset, offset + safeLimit - 1);

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
