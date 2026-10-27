import { describe, expect, test } from "bun:test";
import { finalizeWebhookHttp } from "./stripe-webhook-result.ts";

describe("finalizeWebhookHttp", () => {
  test("acknowledges a webhook only after persistence succeeds", () => {
    expect(finalizeWebhookHttp(false)).toEqual({ status: 200, body: { received: true } });
  });

  test("asks Stripe to retry when the subscription row was not written", () => {
    expect(finalizeWebhookHttp(true)).toEqual({
      status: 500,
      body: { error: "Subscription persistence failed." },
    });
  });
});
