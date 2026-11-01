import { NextResponse } from "next/server";
import { isCoreReady, serviceReadiness } from "@/lib/service-config";

/**
 * GET /api/health
 *
 * Liveness plus configuration readiness, for Vercel, uptime monitors, and the
 * deployment smoke test.
 *
 *  200 {
 *    status: "ok",                    // the process is serving requests
 *    ready: boolean,                  // sign-in and database are configured
 *    services: { auth, database, ... } // "configured" | "not_configured" | "invalid"
 *    ts, version
 *  }
 *
 * Only presence is reported, never values or URLs.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveVersion(): string {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.RAILWAY_GIT_COMMIT_SHA ??
    process.env.COMMIT_SHA ??
    process.env.GIT_COMMIT ??
    process.env.SOURCE_VERSION ??
    "dev"
  );
}

export function GET(): NextResponse {
  const services = serviceReadiness();
  return NextResponse.json(
    {
      status: "ok",
      ready: isCoreReady(services),
      services,
      ts: new Date().toISOString(),
      version: resolveVersion(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
