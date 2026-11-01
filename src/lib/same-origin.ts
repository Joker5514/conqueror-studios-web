/**
 * Cross-site request guard for cookie-authenticated API mutations.
 *
 * Supabase session cookies are SameSite=Lax, which already blocks most
 * cross-site POSTs. This is the explicit second check: a browser request
 * whose Origin (or Sec-Fetch-Site) shows another site is refused before the
 * route runs. Requests without either header come from non-browser clients,
 * which cannot carry a victim's cookies, and are left to normal auth.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Machine-to-machine routes authenticated by a signature, secret, or token. */
export const SAME_ORIGIN_EXEMPT_PATHS = ["/api/stripe/webhook", "/api/gateway", "/api/unsubscribe"] as const;

export type OriginCheckInput = {
  method: string;
  pathname: string;
  origin: string | null;
  secFetchSite: string | null;
  host: string | null;
};

export function isExemptPath(pathname: string): boolean {
  return SAME_ORIGIN_EXEMPT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isBlockedCrossSiteRequest(input: OriginCheckInput): boolean {
  if (SAFE_METHODS.has(input.method.toUpperCase())) return false;
  if (!input.pathname.startsWith("/api/")) return false;
  if (isExemptPath(input.pathname)) return false;

  if (input.origin) {
    if (input.origin === "null") return true;
    try {
      const originHost = new URL(input.origin).host.toLowerCase();
      return !input.host || originHost !== input.host.toLowerCase();
    } catch {
      return true;
    }
  }

  if (input.secFetchSite) {
    return input.secFetchSite.toLowerCase() === "cross-site";
  }

  return false;
}

const CORRELATION_ID = /^[A-Za-z0-9._:-]{8,128}$/;

/** Reuse a well-formed caller correlation ID, otherwise mint one. */
export function resolveCorrelationId(incoming: string | null): string {
  if (incoming && CORRELATION_ID.test(incoming)) return incoming;
  return crypto.randomUUID();
}
