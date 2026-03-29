<<<<<<< Updated upstream
/**
 * Lightweight in-memory rate limiter for admin actions.
 *
 * Keyed by a caller identifier (e.g. the admin dashboard key).
 * Allows a configurable number of mutations per sliding window.
 *
 * NOTE: because this lives in server memory it resets on every cold
 * start and is per-isolate on Vercel serverless. That is acceptable
 * for a simple abuse guard, not a hard security boundary.
 */

const DEFAULT_MAX = 30;
const DEFAULT_WINDOW_MS = 60_000; // 1 minute

interface TokenBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  limit: number;
  remaining: number;
  resetEpochSeconds: number;
  exceeded: boolean;
}

const buckets = new Map<string, TokenBucket>();

export function consumeRateLimit(
  key: string,
  {
    max = DEFAULT_MAX,
    windowMs = DEFAULT_WINDOW_MS,
  }: { max?: number; windowMs?: number } = {},
): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  const exceeded = bucket.count > max;
  const remaining = exceeded ? 0 : Math.max(0, max - bucket.count);

  return {
    limit: max,
    remaining,
    resetEpochSeconds: Math.ceil(bucket.resetAt / 1000),
    exceeded,
  };
}

/**
 * Check (and consume) a rate-limit token for the given key.
 * Throws if the limit has been exceeded.
 */
export function assertRateLimit(
  key: string,
  {
    max = DEFAULT_MAX,
    windowMs = DEFAULT_WINDOW_MS,
  }: { max?: number; windowMs?: number } = {},
): void {
  const result = consumeRateLimit(key, { max, windowMs });
  if (result.exceeded) {
    throw new Error("Too many requests. Please wait a moment before trying again.");
  }
}

/** Exposed for tests only — clear all rate-limit buckets. */
export function _resetRateLimitBuckets(): void {
  buckets.clear();
}
=======
/**
 * Lightweight in-memory rate limiter for admin actions.
 *
 * Keyed by a caller identifier (e.g. the admin dashboard key).
 * Allows a configurable number of mutations per sliding window.
 *
 * NOTE: because this lives in server memory it resets on every cold
 * start and is per-isolate on Vercel serverless. That is acceptable
 * for a simple abuse guard, not a hard security boundary.
 */

const DEFAULT_MAX = 30;
const DEFAULT_WINDOW_MS = 60_000; // 1 minute

interface TokenBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, TokenBucket>();

/**
 * Check (and consume) a rate-limit token for the given key.
 * Throws if the limit has been exceeded.
 */
export function assertRateLimit(
  key: string,
  {
    max = DEFAULT_MAX,
    windowMs = DEFAULT_WINDOW_MS,
  }: { max?: number; windowMs?: number } = {},
): void {
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > max) {
    throw new Error("Too many requests. Please wait a moment before trying again.");
  }
}
>>>>>>> Stashed changes
