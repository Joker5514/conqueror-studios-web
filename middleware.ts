import type { NextRequest } from "next/server";
import { proxy } from "@/proxy";

/**
 * middleware.ts
 *
 * Next.js middleware entry-point. Delegates to src/proxy.ts which calls
 * updateSession() to refresh Supabase auth cookies on every request.
 *
 * Without this, server components read a stale session and users appear
 * logged out after the initial access token expires (~1 hour).
 */
export async function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  matcher: [
    /*
     * Match every path except:
     * - _next/static  (static assets)
     * - _next/image   (Next image optimisation)
     * - favicon.ico
     * - public asset extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
