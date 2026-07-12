/**
 * src/lib/rateLimit.ts
 *
 * Lightweight in-process sliding-window rate limiter.
 *
 * Works in Node.js serverless functions (one process per cold start).
 * For multi-region horizontal scale, swap the Map for an Upstash Redis
 * store — the public API is identical.
 *
 * Usage:
 *   const result = rateLimit(ip, { windowMs: 60_000, max: 3 });
 *   if (!result.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

interface Entry {
  count: number;
  resetAt: number;
}

// Module-level store survives across requests within the same process.
const store = new Map<string, Entry>();

export interface RateLimitResult {
  ok: boolean;
  /** Remaining requests allowed in the current window. */
  remaining: number;
  /** Unix ms when the window resets. */
  resetAt: number;
}

export interface RateLimitOptions {
  /** Window length in milliseconds. Default: 60 000 (1 minute). */
  windowMs?: number;
  /** Maximum requests per window per key. Default: 5. */
  max?: number;
}

export function rateLimit(
  key: string,
  { windowMs = 60_000, max = 5 }: RateLimitOptions = {},
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    // New window.
    const entry: Entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { ok: true, remaining: max - 1, resetAt: entry.resetAt };
  }

  existing.count += 1;
  const remaining = Math.max(0, max - existing.count);
  return {
    ok: existing.count <= max,
    remaining,
    resetAt: existing.resetAt,
  };
}
