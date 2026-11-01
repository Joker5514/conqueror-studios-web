/**
 * Pure decision for the /billing page so every failure mode has an explicit,
 * testable outcome instead of an unhandled exception.
 */

export type BillingInputs = {
  authConfigured: boolean;
  session: "signed_in" | "anonymous" | "unavailable";
  databaseConfigured: boolean;
  paymentsConfigured: boolean;
  lookup: "found_active" | "found_inactive" | "none" | "error";
};

export type BillingOutcome =
  | { kind: "redirect_sign_in" }
  | { kind: "open_portal" }
  | { kind: "no_subscription" }
  | { kind: "unavailable"; reason: "auth" | "database" | "payments" | "lookup_failed" | "auth_service" };

/** Statuses whose holders can still pay or manage billing in the Stripe portal. */
export const PORTAL_ELIGIBLE_STATUSES = new Set(["active", "trialing", "past_due", "unpaid", "paused"]);

export function decideBilling(input: BillingInputs): BillingOutcome {
  if (!input.authConfigured) return { kind: "unavailable", reason: "auth" };
  if (input.session === "unavailable") return { kind: "unavailable", reason: "auth_service" };
  if (input.session === "anonymous") return { kind: "redirect_sign_in" };
  if (!input.databaseConfigured) return { kind: "unavailable", reason: "database" };
  if (input.lookup === "error") return { kind: "unavailable", reason: "lookup_failed" };
  if (input.lookup === "found_active") {
    return input.paymentsConfigured ? { kind: "open_portal" } : { kind: "unavailable", reason: "payments" };
  }
  return { kind: "no_subscription" };
}
