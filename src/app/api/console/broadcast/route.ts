import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * src/app/api/console/broadcast/route.ts
 *
 * Sends a broadcast email to every address in the waitlist table.
 * Auth-gated — owner only.
 *
 * POST /api/console/broadcast
 * Body: { headline: string; summary: string; cta_url: string; cta_label: string }
 */

export interface BroadcastBody {
  headline: string;
  summary: string;
  cta_url: string;
  cta_label: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: Partial<BroadcastBody>;
  try {
    body = await request.json() as Partial<BroadcastBody>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { headline, summary, cta_url, cta_label } = body;
  if (!headline?.trim() || !summary?.trim() || !cta_url?.trim() || !cta_label?.trim()) {
    return NextResponse.json(
      { error: "headline, summary, cta_url, and cta_label are required" },
      { status: 400 },
    );
  }

  // ── Fetch recipient emails via admin client ─────────────────────────────────
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 503 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  const { data: rows, error: dbError } = await admin
    .from("waitlist")
    .select("email")
    .order("created_at", { ascending: true });

  if (dbError) {
    console.error("[broadcast] db error", dbError);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const emails = (rows ?? []).map((r) => (r as { email: string }).email).filter(Boolean);
  if (emails.length === 0) {
    return NextResponse.json({ sent: 0, message: "No recipients in waitlist." });
  }

  // ── Send via Postmark ───────────────────────────────────────────────────────
  const { sendTemplatedEmail } = await import("@/lib/postmark/send");

  let sent = 0;
  const failures: string[] = [];
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://conquerorstudios.dev");
  const unsubscribeBase = `${siteUrl}/unsubscribe`;

  for (const email of emails) {
    try {
      await sendTemplatedEmail({
        to: email,
        templateAlias: "broadcast-update",
        templateModel: {
          product_name: "Conqueror Studios",
          headline,
          summary,
          cta_url,
          cta_label,
          unsubscribe_url: `${unsubscribeBase}?email=${encodeURIComponent(email)}`,
          support_email: "r.jordan@conqueror-studios.com",
        },
      });
      sent++;
    } catch (err) {
      console.error(`[broadcast] failed for ${email}`, err);
      failures.push(email);
    }
  }

  return NextResponse.json({
    sent,
    failed: failures.length,
    total: emails.length,
    ...(failures.length > 0 && { failures }),
  });
}
