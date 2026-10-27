/**
 * Parse a server-only base URL. Missing values stay missing. Callers must
 * not invent a default host. Plain HTTP is allowed only for loopback.
 */

export type ServerUrlResult =
  | { ok: true; href: string }
  | { ok: false; reason: "missing" | "invalid" | "insecure" };

function isLoopback(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function readServerHttpUrl(raw: string | undefined): ServerUrlResult {
  const trimmed = raw?.trim();
  if (!trimmed) return { ok: false, reason: "missing" };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, reason: "invalid" };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "invalid" };
  }
  if (url.protocol !== "https:" && !isLoopback(url.hostname)) {
    return { ok: false, reason: "insecure" };
  }

  const href = url.toString().replace(/\/$/, "");
  return { ok: true, href };
}
