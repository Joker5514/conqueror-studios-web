import { NextResponse } from "next/server";

/**
 * src/app/api/health/route.ts
 *
 * Public health-check endpoint consumed by Vercel, Railway, and uptime monitors.
 *
 * GET /api/health
 * → 200 { status: "ok", ts: <ISO timestamp>, version: <git sha or "dev"> }
 */

export const runtime = "nodejs";
// Disable caching so monitors always get a fresh response.
export const revalidate = 0;

export function GET(): NextResponse {
  return NextResponse.json(
    {
      status: "ok",
      ts: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
