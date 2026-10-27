/**
 * Canonical public origin.
 *
 * www.conqueror-studios.com is the live site (apex redirects there).
 * conquerorstudios.dev had no DNS on 2026-10-27, so a stale env value
 * for that host is rewritten to the live origin. Other configured
 * origins, including local development and Vercel preview hosts, are preserved.
 */

export const CANONICAL_SITE_ORIGIN = "https://www.conqueror-studios.com";

const RETIRED_HOSTS = new Set([
  "conquerorstudios.dev",
  "www.conquerorstudios.dev",
]);

export function configuredSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    try {
      const url = new URL(fromEnv);
      if (url.protocol === "https:" || url.protocol === "http:") {
        if (RETIRED_HOSTS.has(url.hostname.toLowerCase())) return CANONICAL_SITE_ORIGIN;
        return url.origin;
      }
    } catch {
      // Ignore a malformed env value and use the canonical origin.
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return CANONICAL_SITE_ORIGIN;
}
