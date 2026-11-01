import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { PORTAL_ELIGIBLE_STATUSES, type BillingInputs, decideBilling } from "@/lib/billing-state";
import { log } from "@/lib/log";
import { isAuthConfigured, isDatabaseConfigured, isStripeApiConfigured } from "@/lib/service-config";
import { configuredSiteOrigin } from "@/lib/site-url";
import { lookupSession } from "@/lib/supabase/session";

export const metadata: Metadata = {
  title: "Billing",
  robots: { index: false, follow: false },
};

const UNAVAILABLE_COPY: Record<string, string> = {
  auth: "Billing needs sign-in, and sign-in is not configured on this deployment.",
  auth_service: "The sign-in service did not respond. Try again in a minute.",
  database: "Billing records are not configured on this deployment.",
  payments: "Payments are not configured on this deployment, so the billing portal cannot open.",
  lookup_failed: "We could not load your billing record. Try again in a minute.",
  portal_failed: "Stripe did not open the billing portal. Try again in a minute.",
};

async function lookupSubscription(email: string): Promise<{
  lookup: BillingInputs["lookup"];
  customerId: string | null;
}> {
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { data, error } = await createAdminClient()
      .from("subscriptions")
      .select("stripe_customer_id, status")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      log.error("billing.subscription_lookup_failed", { code: error.code });
      return { lookup: "error", customerId: null };
    }
    if (!data?.stripe_customer_id) return { lookup: "none", customerId: null };
    const active = PORTAL_ELIGIBLE_STATUSES.has(data.status ?? "");
    return { lookup: active ? "found_active" : "found_inactive", customerId: data.stripe_customer_id };
  } catch (err) {
    log.error("billing.subscription_lookup_threw", { err });
    return { lookup: "error", customerId: null };
  }
}

async function openPortal(customerId: string): Promise<string | null> {
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${configuredSiteOrigin()}/billing`,
    });
    return session.url;
  } catch (err) {
    log.error("billing.portal_session_failed", { err });
    return null;
  }
}

export default async function BillingPage() {
  await connection();
  const authConfigured = isAuthConfigured();
  const session = authConfigured ? await lookupSession() : null;
  const databaseConfigured = isDatabaseConfigured();
  const email = session?.state === "signed_in" ? (session.user.email ?? "") : "";

  const subscription =
    session?.state === "signed_in" && databaseConfigured && email
      ? await lookupSubscription(email)
      : { lookup: "none" as const, customerId: null };

  const outcome = decideBilling({
    authConfigured,
    session:
      session?.state === "signed_in" ? "signed_in" : session?.state === "anonymous" || !session ? "anonymous" : "unavailable",
    databaseConfigured,
    paymentsConfigured: isStripeApiConfigured(),
    lookup: subscription.lookup,
  });

  if (outcome.kind === "redirect_sign_in") redirect("/auth");

  let unavailableReason: string | null = outcome.kind === "unavailable" ? outcome.reason : null;
  if (outcome.kind === "open_portal" && subscription.customerId) {
    const url = await openPortal(subscription.customerId);
    if (url) redirect(url);
    unavailableReason = "portal_failed";
  }

  if (unavailableReason) {
    return (
      <BillingPanel eyebrow="Billing unavailable" title="Billing is temporarily unavailable">
        {UNAVAILABLE_COPY[unavailableReason]}
      </BillingPanel>
    );
  }

  return (
    <BillingPanel eyebrow="Billing" title="No active subscription">
      You don&apos;t have an active Conqueror Studios subscription. Join the waitlist to
      get early access when we open new seats.
    </BillingPanel>
  );
}

function BillingPanel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">{eyebrow}</div>
        <h1 className="text-[24px] font-medium tracking-tight text-white">{title}</h1>
        <p className="text-[14px] leading-relaxed text-white/65">{children}</p>
        <div className="flex flex-col items-center gap-3">
          <Link href="/waitlist" className="cs-btn-deploy inline-block px-6 py-2.5 text-[10px]">
            Join the waitlist →
          </Link>
          <Link
            href="/support"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/55 transition-colors hover:text-white"
          >
            Contact the lab
          </Link>
        </div>
      </div>
    </div>
  );
}
