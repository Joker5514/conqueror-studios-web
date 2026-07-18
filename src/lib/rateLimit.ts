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
  /** Timestamps (ms) of requests still inside the current window. */
  timestamps: number[];
}

// Module-level store survives across requests within the same process.
const store = new Map<string, Entry>();

/** Hard cap so a pathological flood of unique keys cannot OOM the process. */
const MAX_KEYS = 5_000;

export interface RateLimitResult {
  ok: boolean;
  /** Remaining requests allowed in the current window. */
  remaining: number;
  /** Unix ms when the oldest in-window request ages out (or now if empty). */
  resetAt: number;
}

export interface RateLimitOptions {
  /** Window length in milliseconds. Default: 60 000 (1 minute). */
  windowMs?: number;
  /** Maximum requests per window per key. Default: 5. */
  max?: number;
}

function pruneExpired(entry: Entry, now: number, windowMs: number): void {
  const cutoff = now - windowMs;
  // Drop timestamps older than the window (array is append-only / chronological).
  let i = 0;
  while (i < entry.timestamps.length) {
    const ts = entry.timestamps[i];
    if (ts === undefined || ts >= cutoff) break;
    i += 1;
  }
  if (i > 0) entry.timestamps.splice(0, i);
}

function sweepExpired(now: number, windowMs: number): void {
  for (const [k, entry] of store.entries()) {
    pruneExpired(entry, now, windowMs);
    if (entry.timestamps.length === 0) store.delete(k);
  }
}

export function rateLimit(
  key: string,
  { windowMs = 60_000, max = 5 }: RateLimitOptions = {},
): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup: only when the map is large, avoid O(n) on every call.
  if (store.size > 1_000) {
    sweepExpired(now, windowMs);
  }

  // Bound total keys (evict arbitrary oldest-looking empty/stale first, then any).
  if (store.size >= MAX_KEYS && !store.has(key)) {
    sweepExpired(now, windowMs);
    if (store.size >= MAX_KEYS) {
      const first = store.keys().next().value;
      if (first !== undefined) store.delete(first);
    }
  }

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  } else {
    pruneExpired(entry, now, windowMs);
  }

  if (entry.timestamps.length >= max) {
    const oldest = entry.timestamps[0] ?? now;
    return {
      ok: false,
      remaining: 0,
      resetAt: oldest + windowMs,
    };
  }

  entry.timestamps.push(now);
  const remaining = Math.max(0, max - entry.timestamps.length);
  const oldest = entry.timestamps[0] ?? now;
  return {
    ok: true,
    remaining,
    resetAt: oldest + windowMs,
  };
}
