import { describe, expect, test } from "bun:test";
import { decideBilling, PORTAL_ELIGIBLE_STATUSES } from "./billing-state.ts";

const base = {
  authConfigured: true,
  session: "signed_in",
  databaseConfigured: true,
  paymentsConfigured: true,
  lookup: "none",
};

describe("decideBilling", () => {
  test("no auth configuration is an explicit unavailable state", () => {
    expect(decideBilling({ ...base, authConfigured: false })).toEqual({ kind: "unavailable", reason: "auth" });
  });

  test("anonymous visitors are sent to sign in", () => {
    expect(decideBilling({ ...base, session: "anonymous" })).toEqual({ kind: "redirect_sign_in" });
  });

  test("an unreachable auth service is not treated as signed out", () => {
    expect(decideBilling({ ...base, session: "unavailable" })).toEqual({ kind: "unavailable", reason: "auth_service" });
  });

  test("missing database configuration is unavailable, not 'no subscription'", () => {
    expect(decideBilling({ ...base, databaseConfigured: false })).toEqual({ kind: "unavailable", reason: "database" });
  });

  test("a failed lookup is unavailable, not 'no subscription'", () => {
    expect(decideBilling({ ...base, lookup: "error" })).toEqual({ kind: "unavailable", reason: "lookup_failed" });
  });

  test("an eligible subscription opens the portal when Stripe is configured", () => {
    expect(decideBilling({ ...base, lookup: "found_active" })).toEqual({ kind: "open_portal" });
    expect(decideBilling({ ...base, lookup: "found_active", paymentsConfigured: false })).toEqual({
      kind: "unavailable",
      reason: "payments",
    });
  });

  test("past_due customers can reach the portal (dunning emails link here)", () => {
    expect(PORTAL_ELIGIBLE_STATUSES.has("past_due")).toBe(true);
    expect(PORTAL_ELIGIBLE_STATUSES.has("unpaid")).toBe(true);
    expect(PORTAL_ELIGIBLE_STATUSES.has("canceled")).toBe(false);
  });

  test("no record or an inactive record shows the no-subscription page", () => {
    expect(decideBilling({ ...base, lookup: "none" })).toEqual({ kind: "no_subscription" });
    expect(decideBilling({ ...base, lookup: "found_inactive" })).toEqual({ kind: "no_subscription" });
  });
});
