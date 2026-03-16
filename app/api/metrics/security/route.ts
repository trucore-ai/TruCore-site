/**
 * GET /api/metrics/security
 *
 * Public Prometheus-compatible security metrics endpoint.
 *
 * Exposes only safe aggregate counters and gauges — no secrets,
 * tokens, IPs, cookies, or per-user dimensions.
 *
 * The existing admin-only JSON telemetry at /api/admin/security
 * remains unchanged for richer operator detail.
 *
 * Content-Type: text/plain; version=0.0.4; charset=utf-8
 */

import { serializePrometheusMetrics } from "@/lib/security-metrics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET(): Response {
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
