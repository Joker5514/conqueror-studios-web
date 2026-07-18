import { NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * src/app/api/stripe/webhook/route.ts
 *
 * Handles inbound Stripe webhook events with signature verification.
 * Business logic stubs are wired here — fill in each case as billing
 * requirements solidify.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY        — Stripe secret key
 *   STRIPE_WEBHOOK_SECRET    — Signing secret from `stripe listen` or dashboard
 */

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // ── Event dispatch ──────────────────────────────────────────────────────────
  //
  // Add handlers for each event type as billing flows are built out.
  // Keep this switch exhaustive; unhandled events fall through to { received: true }.

  // Phase-1 stubs: log and acknowledge. Provisioning handlers will be wired
  // before enabling live Stripe webhooks in production. Stripe retries on
  // non-2xx; once business logic lands, persist `event.id` for idempotency.
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // TODO: provision access — look up user by session.customer_email,
      // upsert a `subscriptions` row (keyed by event.id for idempotency),
      // and send a welcome email. Do not return 2xx until that write succeeds.
      console.log("[stripe] checkout.session.completed", session.id, session.customer_email);
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      // TODO: sync subscription status to Supabase `subscriptions` table.
      console.log(`[stripe] ${event.type}`, subscription.id, subscription.status);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      // TODO: revoke access — mark subscription as cancelled in Supabase.
      console.log("[stripe] customer.subscription.deleted", subscription.id);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      // TODO: record successful payment and reset any dunning flags.
      console.log("[stripe] invoice.payment_succeeded", invoice.id);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      // TODO: notify user and start dunning sequence.
      console.log("[stripe] invoice.payment_failed", invoice.id);
      break;
    }

    default:
      // Unknown event — safe to ignore.
      break;
  }

  return NextResponse.json({ received: true });
}
