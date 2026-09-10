import { NextResponse } from "next/server";
import { isValidUnsubscribeToken } from "@/lib/unsubscribe-token";

/**
 * src/app/api/unsubscribe/route.ts
 *
 * Public, signed unsubscribe endpoint. A token binds each request to the
 * recipient address so an arbitrary caller cannot remove someone else.
 *
 * POST /api/unsubscribe
 * Body: { email: string, token: string }
 */

export async function POST(request: Request): Promise<NextResponse> {
  let email: string | undefined;
  let token: string | undefined;
  try {
    const body = await request.json() as { email?: unknown; token?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    token = typeof body.token === "string" ? body.token : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!email || !token) {
    return NextResponse.json({ error: "email and token are required" }, { status: 400 });
  }

  if (!isValidUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 403 });
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
