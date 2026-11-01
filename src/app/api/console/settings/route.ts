import { NextResponse } from "next/server";
import { requireConsoleOwner } from "@/lib/console-owner";
import { isCoreReady, serviceReadiness } from "@/lib/service-config";

/**
 * src/app/api/console/settings/route.ts
 *
 * Returns environment health — which vars are configured — for the
 * Settings tab. Values are never returned, only presence booleans.
 *
 * GET /api/console/settings
 * → { env: Record<string, boolean>, health: { status, ts, version } }
 */

const CHECKED_VARS: Record<string, string> = {
  supabase_url:          "NEXT_PUBLIC_SUPABASE_URL",
  supabase_anon_key:     "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  supabase_service_key:  "SUPABASE_SERVICE_ROLE_KEY",
  postmark_token:        "POSTMARK_SERVER_TOKEN",
  postmark_from_email:   "POSTMARK_FROM_EMAIL",
  stripe_secret_key:     "STRIPE_SECRET_KEY",
  stripe_webhook_secret: "STRIPE_WEBHOOK_SECRET",
  nexus_url:             "NEXUS_URL",
  bridge_url:            "BRIDGE_URL",
  console_owner_emails:  "CONSOLE_OWNER_EMAILS",
  unsubscribe_secret:    "UNSUBSCRIBE_TOKEN_SECRET",
  gateway_secret:        "GATEWAY_SECRET",
  openai_api_key:        "OPENAI_API_KEY",
  anthropic_api_key:     "ANTHROPIC_API_KEY",
  xai_api_key:           "XAI_API_KEY",
};

export async function GET(): Promise<NextResponse> {
  const access = await requireConsoleOwner();
  if (!access.ok) return access.response;

  const env: Record<string, boolean> = {};
  for (const [key, varName] of Object.entries(CHECKED_VARS)) {
    env[key] = Boolean(process.env[varName]?.trim());
  }

  const services = serviceReadiness();
  return NextResponse.json({
    env,
    services,
    ready: isCoreReady(services),
    deploy: {
      version: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
      env_name: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      region: process.env.VERCEL_REGION ?? "local",
      nexus_url: services.nexus === "configured" ? "configured" : services.nexus === "invalid" ? "invalid" : "not set",
      bridge_url: services.bridge === "configured" ? "configured" : services.bridge === "invalid" ? "invalid" : "not set",
    },
  });
}
