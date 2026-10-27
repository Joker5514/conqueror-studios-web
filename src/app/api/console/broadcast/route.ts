import { NextResponse } from "next/server";
import { isHttpsUrl } from "@/lib/broadcast-url";
import { requireConsoleOwner } from "@/lib/console-owner";
import { rateLimit } from "@/lib/rateLimit";
import { configuredSiteOrigin } from "@/lib/site-url";
import { createUnsubscribeToken } from "@/lib/unsubscribe-token";

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
  const access = await requireConsoleOwner();
  if (!access.ok) return access.response;
  const { user } = access;

  const limit = rateLimit(`broadcast:${user.id}`, { windowMs: 60 * 60_000, max: 3 });
  if (!limit.ok) {
    return NextResponse.json({ error: "Too many broadcasts", code: "rate_limited" }, { status: 429 });
  }
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
  if (headline.trim().length > 200 || summary.trim().length > 5000 || cta_label.trim().length > 80) {
    return NextResponse.json({ error: "Broadcast fields are too long" }, { status: 400 });
  }
  if (!isHttpsUrl(cta_url)) {
    return NextResponse.json({ error: "cta_url must be an https URL" }, { status: 400 });
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
  const siteUrl = configuredSiteOrigin();
  const unsubscribeBase = `${siteUrl}/unsubscribe`;

  for (const email of emails) {
    const unsubscribeToken = createUnsubscribeToken(email);
    if (!unsubscribeToken) {
      return NextResponse.json(
        { error: "Unsubscribe links are not configured" },
        { status: 503 },
      );
    }

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
          unsubscribe_url: `${unsubscribeBase}?email=${encodeURIComponent(email)}&token=${encodeURIComponent(unsubscribeToken)}`,
          support_email: "r.jordan@conqueror-studios.com",
        },
      });
      sent++;
    } catch (err) {
      console.error("[broadcast] send failed", err instanceof Error ? err.message : "unknown");
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
