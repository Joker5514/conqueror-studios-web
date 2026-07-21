import { NextResponse } from "next/server";

/**
 * src/app/api/unsubscribe/route.ts
 *
 * Public (no auth) unsubscribe endpoint.
 * Removes the given email from the waitlist table using the admin client.
 *
 * POST /api/unsubscribe
 * Body: { email: string }
 */

export async function POST(request: Request): Promise<NextResponse> {
  let email: string | undefined;
  try {
    const body = await request.json() as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Service not configured" }, { status: 503 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const { error: dbError } = await admin
    .from("waitlist")
    .delete()
    .eq("email", email);

  if (dbError) {
    console.error("[unsubscribe] db error", dbError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
