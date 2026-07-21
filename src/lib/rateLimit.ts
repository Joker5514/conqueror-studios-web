/**
 * src/lib/rateLimit.ts
 *
 * Sliding-window rate limiter with an in-process Map store.
 *
 * ── Upstash Redis swap ────────────────────────────────────────────────────────
 * The Map store works correctly within a single serverless process (single-region
 * Vercel or Railway). For multi-region deployments replace the store with Upstash:
 *
 *   import { Redis } from "@upstash/redis";
 *   const redis = Redis.fromEnv();               // UPSTASH_REDIS_REST_URL + TOKEN
 *
 *   // In rateLimit(), replace the Map get/set block with:
 *   const key = `rl:${rawKey}`;
 *   const [[, count], [, resetAt]] = await redis.pipeline()
 *     .incr(key)
 *     .pexpireat(key, Date.now() + windowMs)   // set TTL only on first call
 *     .exec();
 *   return { ok: (count as number) <= max, remaining: Math.max(0, max - (count as number)), resetAt };
 *
 * The public rateLimit(key, opts) signature stays identical.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Usage:
 *   const result = rateLimit(`waitlist:${ip}`, { windowMs: 60_000, max: 3 });
 *   if (!result.ok) return { ok: false, error: "Too many requests." };
 */

interface Entry {
  /** Timestamps (ms) of requests still inside the current window. */
  timestamps: number[];
}

// Module-level store — survives across requests within the same process instance.
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
