import { NextResponse } from "next/server";
import Stripe from "stripe";
import { configuredSiteOrigin } from "@/lib/site-url";
import { finalizeWebhookHttp } from "@/lib/stripe-webhook-result";

/**
 * src/app/api/stripe/webhook/route.ts
 *
 * Handles inbound Stripe webhook events with signature verification.
 * Upserts subscription state to the `subscriptions` table on key lifecycle events.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY        — Stripe secret key
 *   STRIPE_WEBHOOK_SECRET    — Signing secret from `stripe listen` or dashboard
 *   SUPABASE_SERVICE_ROLE_KEY — Required for DB writes (bypasses RLS)
 */

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

async function upsertSubscription(sub: Stripe.Subscription): Promise<boolean> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[stripe] subscription persistence is not configured");
    return false;
  }
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const email =
    typeof sub.customer === "object" && sub.customer !== null && "email" in sub.customer
      ? (sub.customer as Stripe.Customer).email
      : null;

  // In Stripe v22 current_period_start/end moved from Subscription to SubscriptionItem.
  const item = sub.items?.data?.[0];
  const plan =
    item?.price?.lookup_key ??
    item?.price?.nickname ??
    item?.price?.id ??
    null;

  const { error } = await admin.from("subscriptions").upsert(
    {
      stripe_customer_id: customer,
      stripe_subscription_id: sub.id,
      email,
      status: sub.status,
      plan,
      current_period_start: item?.current_period_start
        ? new Date(item.current_period_start * 1000).toISOString()
        : null,
      current_period_end: item?.current_period_end
        ? new Date(item.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end,
    },
    { onConflict: "stripe_subscription_id" },
  );
  if (error) {
    console.error("[stripe] upsert failed", error);
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  if (!stripe || !stripeWebhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET environment variables." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature header." },
      { status: 400 },
    );
  }

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  let persistenceFailed = false;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      console.log("[stripe] checkout.session.completed", session.id);
      // If the checkout created a subscription, upsert it now.
      if (session.subscription) {
        try {
          const sub = await stripe.subscriptions.retrieve(
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id,
          );
          if (!(await upsertSubscription(sub))) persistenceFailed = true;
        } catch (err) {
          console.error("[stripe] failed to retrieve/upsert subscription", err);
          persistenceFailed = true;
        }
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      console.log(`[stripe] ${event.type}`, subscription.id, subscription.status);
      if (!(await upsertSubscription(subscription))) persistenceFailed = true;
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      console.log("[stripe] customer.subscription.deleted", subscription.id);
      if (!(await upsertSubscription(subscription))) persistenceFailed = true;
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      console.log("[stripe] invoice.payment_succeeded", invoice.id);
      // Subscription status already updated via subscription.updated event.
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      console.log("[stripe] invoice.payment_failed", invoice.id);
      // Trigger dunning email to the customer.
      const customerEmail =
        typeof invoice.customer_email === "string"
          ? invoice.customer_email
          : typeof invoice.customer === "object" && invoice.customer !== null && "email" in invoice.customer
          ? (invoice.customer as { email: string | null }).email
          : null;
      if (customerEmail && process.env.POSTMARK_SERVER_TOKEN) {
        const { sendTemplatedEmail } = await import("@/lib/postmark/send");
        const siteUrl = configuredSiteOrigin();
        const amountDue =
          typeof invoice.amount_due === "number"
            ? `$${(invoice.amount_due / 100).toFixed(2)}`
            : "—";
        await sendTemplatedEmail({
          to: customerEmail,
          templateAlias: "payment-failed",
          templateModel: {
            product_name: "Conqueror Studios",
            customer_email: customerEmail,
            invoice_id: invoice.id,
            amount_due: amountDue,
            update_billing_url: `${siteUrl}/billing`,
            support_email: "r.jordan@conqueror-studios.com",
          },
        }).catch((err) => console.error("[stripe] dunning email failed", err));
      }
      break;
    }

    default:
      break;
  }

  const http = finalizeWebhookHttp(persistenceFailed);
  return NextResponse.json(http.body, { status: http.status });
}
