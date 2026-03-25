/**
 * GET /api/metrics/security
 *
 * Public Prometheus-compatible security metrics endpoint.
 *
 * Exposes only safe aggregate counters and gauges - no secrets,
 * tokens, IPs, cookies, or per-user dimensions.
 *
 * Abuse protection:
 * - Lightweight in-memory rate limiter keyed by hashed client IP.
 *   Allows 60 requests per 60-second window - well above typical
 *   Prometheus scrape intervals (15–30 s). Only intended to damp
 *   obvious probe spam, not a hard security boundary.
 *
 * Caching:
 * - Serialized Prometheus text is cached in-memory for ~10 s to
 *   reduce repeated serialization under burst traffic. Metrics
 *   are approximate within the TTL window.
 *
 * The existing admin-only JSON telemetry at /api/admin/security
 * remains unchanged for richer operator detail.
 *
 * Content-Type: text/plain; version=0.0.4; charset=utf-8
 */

import { serializePrometheusMetrics } from "@/lib/security-metrics";
import { consumeRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";
import { sha256 } from "@/lib/hash";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Generous limit: 60 requests per 60 s per IP hash. */
const METRICS_RATE_LIMIT_MAX = 60;
const METRICS_RATE_LIMIT_WINDOW_MS = 60_000;

/**
 * Extract a rate-limit key from the request.
 * Uses a truncated hash of the client IP - never stores or returns the raw IP.
 */
function rateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const raw =
    forwarded?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";
  return `metrics:${sha256(raw).slice(0, 12)}`;
}

export function GET(request: Request): Response {
  /* ── Rate-limit check ── */
  const key = rateLimitKey(request);
  const rl = consumeRateLimit(key, {
    max: METRICS_RATE_LIMIT_MAX,
    windowMs: METRICS_RATE_LIMIT_WINDOW_MS,
  });

  if (rl.exceeded) {
    logSecurityEvent("metrics_route_rate_limited", {});
    const retryAfter = Math.max(
      1,
      Math.ceil((rl.resetEpochSeconds * 1000 - Date.now()) / 1000),
    );
    return new Response("", {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  /* ── Normal response (may be served from short-lived cache) ── */
  const body = serializePrometheusMetrics();

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
