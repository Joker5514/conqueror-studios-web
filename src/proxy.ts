import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * src/proxy.ts
 *
 * Next.js 16+ request proxy (formerly middleware).
 * Refreshes Supabase auth cookies on matched requests so server components
 * do not see a stale session after the access token expires (~1 hour).
 *
 * Matcher excludes static assets, the public health probe, and the Stripe
 * webhook (raw body + signature must not be wrapped).
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match every path except:
     * - _next/static  (static assets)
     * - _next/image   (Next image optimisation)
     * - favicon.ico
     * - public asset extensions
     * - /api/health   (public uptime probe — no session needed)
     * - /api/stripe/webhook (raw body + Stripe sig — must not be wrapped)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/health|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
