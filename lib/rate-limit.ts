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
