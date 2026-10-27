/**
 * Stripe must not treat a webhook as delivered when the subscription row
 * was not written. A 500 makes Stripe retry. Signature failures stay 400
 * and are not retried as successful deliveries.
 */

export function finalizeWebhookHttp(persistenceFailed: boolean): {
  status: 200 | 500;
  body: { received: true } | { error: string };
} {
  if (persistenceFailed) {
    return { status: 500, body: { error: "Subscription persistence failed." } };
  }
  return { status: 200, body: { received: true } };
}
