import { NextResponse, type NextRequest } from "next/server";
import { isBlockedCrossSiteRequest, resolveCorrelationId } from "@/lib/same-origin";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 request proxy (formerly middleware).
 *
 * 1. Refuses cross-site mutations of cookie-authenticated API routes.
 * 2. Gives every API request an `x-correlation-id` (reused when the caller
 *    sent a well-formed one) on both the request and the response.
 * 3. Refreshes Supabase auth cookies so server components do not see a stale
 *    session after the access token expires (~1 hour).
 *
 * Matcher excludes static assets, the public health probe, and the Stripe
 * webhook (raw body + signature must not be wrapped).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const correlationId = isApi ? resolveCorrelationId(request.headers.get("x-correlation-id")) : null;

  if (
    isBlockedCrossSiteRequest({
      method: request.method,
      pathname,
      origin: request.headers.get("origin"),
      secFetchSite: request.headers.get("sec-fetch-site"),
      host: request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
    })
  ) {
    return NextResponse.json(
      { error: "Cross-site request refused", code: "cross_origin_blocked", correlation_id: correlationId },
      { status: 403, headers: correlationId ? { "x-correlation-id": correlationId } : undefined },
    );
  }

  const extraHeaders = correlationId ? { "x-correlation-id": correlationId } : undefined;
  const response = await updateSession(request, extraHeaders);
  if (correlationId) response.headers.set("x-correlation-id", correlationId);
  return response;
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
    "/((?!_next/static|_next/image|favicon\\.ico|api/health|api/stripe/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp4|ico)$).*)",
  ],
};
