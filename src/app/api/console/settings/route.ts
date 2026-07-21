import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
};

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const env: Record<string, boolean> = {};
  for (const [key, varName] of Object.entries(CHECKED_VARS)) {
    env[key] = Boolean(process.env[varName]?.trim());
  }

  return NextResponse.json({
    env,
    deploy: {
      version: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
      env_name: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      region: process.env.VERCEL_REGION ?? "local",
      nexus_url: process.env.NEXUS_URL ? "configured" : "not set",
      bridge_url: process.env.BRIDGE_URL ? "configured" : "not set",
    },
  });
}
