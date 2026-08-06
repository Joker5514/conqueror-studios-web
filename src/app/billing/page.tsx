import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * src/app/billing/page.tsx
 *
 * /billing — Subscription management page.
 *
 * Flow:
 *   - No session  →  redirect to /auth
 *   - Session + active Stripe subscription  →  redirect to Stripe Customer Portal
 *   - Session + no subscription  →  show "No active subscription" + waitlist link
 */

export default async function BillingPage() {
  // ── 1. Auth check ───────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // ── 2. Look up subscription ─────────────────────────────────────────────────
  const admin = createAdminClient();
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("stripe_customer_id, status")
    .eq("email", user.email ?? "")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hasActiveSubscription =
    subscription?.stripe_customer_id != null &&
    ["active", "trialing"].includes(subscription.status ?? "");

  // ── 3. Redirect to portal if subscription exists ────────────────────────────
  if (hasActiveSubscription) {
    // Call the portal API server-side to get the redirect URL
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://conquerorstudios.dev");

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const customerId = subscription?.stripe_customer_id;
    if (stripeSecretKey && customerId) {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeSecretKey);
      const session = await stripe.billingPortal.sessions.create({
        customer:   customerId,
        return_url: `${siteUrl}/billing`,
      });
      redirect(session.url);
    }
  }

  // ── 4. No subscription — show informational page ────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/30">
          Billing
        </div>
        <h1 className="text-[24px] font-medium tracking-tight text-white">
          No active subscription
        </h1>
        <p className="text-[14px] leading-relaxed text-white/50">
          You don&apos;t have an active Conqueror Studios subscription. Join the
          waitlist to get early access when we open up new seats.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/waitlist"
            className="cs-btn-deploy inline-block px-6 py-2.5 text-[10px]"
          >
            Join the waitlist →
          </Link>
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/30 hover:text-white transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
