import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * src/app/api/billing/portal/route.ts
 *
 * POST /api/billing/portal
 *
 * Creates a Stripe Customer Portal session and returns the redirect URL.
 * Looks up the user's stripe_customer_id from the `subscriptions` table.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY          — Stripe secret key
 *   NEXT_PUBLIC_SITE_URL       — Used for the return_url (falls back to request origin)
 */

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Auth guard ──────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Stripe key check ────────────────────────────────────────────────────
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured on this server." },
      { status: 500 },
    );
  }

  const stripe = new Stripe(stripeSecretKey);

  // ── 3. Look up Stripe customer id from subscriptions table ─────────────────
  const admin = createAdminClient();
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("email", user.email ?? "")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No active subscription found." },
      { status: 404 },
    );
  }

  // ── 4. Return URL ──────────────────────────────────────────────────────────
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    req.headers.get("origin") ??
    "https://conquerorstudios.dev";
  const returnUrl = `${origin}/billing`;

  // ── 5. Create portal session ───────────────────────────────────────────────
  const session = await stripe.billingPortal.sessions.create({
    customer:   subscription.stripe_customer_id,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: session.url });
}
