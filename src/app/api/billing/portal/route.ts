import { NextResponse } from "next/server";
import { log } from "@/lib/log";
import { isDatabaseConfigured, isStripeApiConfigured } from "@/lib/service-config";
import { configuredSiteOrigin } from "@/lib/site-url";
import { lookupSession } from "@/lib/supabase/session";

/**
 * POST /api/billing/portal
 *
 * Creates a Stripe Customer Portal session for the signed-in user's own
 * customer record and returns { url }. Every failure is a JSON error with a
 * stable code; nothing here throws a 500.
 */

function fail(status: number, code: string, error: string): NextResponse {
  return NextResponse.json({ error, code }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(): Promise<NextResponse> {
  const session = await lookupSession();
  if (session.state === "unconfigured") return fail(503, "auth_unconfigured", "Sign-in is not configured.");
  if (session.state === "unavailable") return fail(503, "auth_unavailable", "Sign-in service unavailable.");
  if (session.state === "anonymous") return fail(401, "unauthorized", "Unauthorized");

  if (!isDatabaseConfigured()) return fail(503, "database_unconfigured", "Billing records are not configured.");
  if (!isStripeApiConfigured()) return fail(503, "payments_unconfigured", "Payments are not configured.");

  const email = session.user.email ?? "";
  if (!email) return fail(404, "no_subscription", "No active subscription found.");

  let customerId: string | null = null;
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { data, error } = await createAdminClient()
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      log.error("billing.portal.lookup_failed", { code: error.code });
      return fail(503, "lookup_failed", "Could not load the billing record.");
    }
    customerId = data?.stripe_customer_id ?? null;
  } catch (err) {
    log.error("billing.portal.lookup_threw", { err });
    return fail(503, "lookup_failed", "Could not load the billing record.");
  }

  if (!customerId) return fail(404, "no_subscription", "No billing record found.");

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${configuredSiteOrigin()}/billing`,
    });
    return NextResponse.json({ url: portal.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    log.error("billing.portal.stripe_failed", { err });
    return fail(502, "stripe_unavailable", "Stripe did not open the billing portal.");
  }
}
