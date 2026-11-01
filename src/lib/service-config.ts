import { bridgeBaseUrl } from "@/lib/bridge-client";
import { parseConsoleOwnerEmails } from "@/lib/console-owner-emails";
import { nexusBaseUrl } from "@/lib/nexus-client";
import { tryGetSupabaseAdminEnv, tryGetSupabaseServerEnv } from "@/lib/supabase/server-env";

/**
 * Which backends this deployment can actually use, derived from environment
 * variables only. Values are never returned, only presence.
 */

export type ServiceState = "configured" | "not_configured" | "invalid";

export type ServiceName =
  | "auth"
  | "database"
  | "console_owners"
  | "email"
  | "payments"
  | "ai_gateway"
  | "nexus"
  | "bridge";

export type ServiceReadiness = Record<ServiceName, ServiceState>;

function present(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

/** Magic-link sign-in needs the browser keys and a server client. */
export function isAuthConfigured(): boolean {
  return (
    present("NEXT_PUBLIC_SUPABASE_URL") &&
    present("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
    tryGetSupabaseServerEnv() !== null
  );
}

/** Service-role access for server-side writes (waitlist, runs, billing). */
export function isDatabaseConfigured(): boolean {
  return tryGetSupabaseAdminEnv() !== null;
}

export function isEmailConfigured(): boolean {
  return present("POSTMARK_SERVER_TOKEN") && present("POSTMARK_FROM_EMAIL");
}

/** The Stripe API key alone is enough to open a billing portal session. */
export function isStripeApiConfigured(): boolean {
  return present("STRIPE_SECRET_KEY");
}

/** Full payments setup: API calls plus verified webhooks that sync state. */
export function isPaymentsConfigured(): boolean {
  return present("STRIPE_SECRET_KEY") && present("STRIPE_WEBHOOK_SECRET");
}

export function isAiGatewayConfigured(): boolean {
  return (
    present("GATEWAY_SECRET") &&
    (present("OPENAI_API_KEY") || present("ANTHROPIC_API_KEY") || present("XAI_API_KEY"))
  );
}

function urlState(result: { ok: true } | { ok: false; reason: string }): ServiceState {
  if (result.ok) return "configured";
  return result.reason === "missing" ? "not_configured" : "invalid";
}

export function serviceReadiness(): ServiceReadiness {
  const flag = (ok: boolean): ServiceState => (ok ? "configured" : "not_configured");
  return {
    auth: flag(isAuthConfigured()),
    database: flag(isDatabaseConfigured()),
    console_owners: flag(parseConsoleOwnerEmails(process.env.CONSOLE_OWNER_EMAILS).length > 0),
    email: flag(isEmailConfigured()),
    payments: flag(isPaymentsConfigured()),
    ai_gateway: flag(isAiGatewayConfigured()),
    nexus: urlState(nexusBaseUrl()),
    bridge: urlState(bridgeBaseUrl()),
  };
}

/** Services the public site needs for sign-in and waitlist signups. */
export const CORE_SERVICES: readonly ServiceName[] = ["auth", "database"];

export function isCoreReady(readiness: ServiceReadiness): boolean {
  return CORE_SERVICES.every((name) => readiness[name] === "configured");
}
