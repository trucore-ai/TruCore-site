import { z } from "zod";

/* ────────────────────────────────────────────────────────────────
 *  Public Infrastructure Metrics Client
 *
 *  Typed client for the ATF GET /metrics/public-summary endpoint.
 *  This is a public, cache-friendly, rate-limited endpoint that
 *  returns a stable contract of high-level infrastructure signals
 *  suitable for marketing surfaces.
 *
 *  The base URL is read from NEXT_PUBLIC_ATF_DASHBOARD_URL (same
 *  base as the dashboard client).
 *
 *  ATF responses are wrapped in a standard envelope:
 *    { status, summary?, result, _meta? }
 *  The fetch helper unwraps the envelope automatically and
 *  validates `result` against the expected Zod schema.
 * ──────────────────────────────────────────────────────────── */

// ── Schema ───────────────────────────────────────────────────

export const VerificationSummarySchema = z.object({
  receipts_written: z.number(),
  receipts_verified: z.number(),
  permits_issued: z.number(),
  intents_approved: z.number(),
});

export type VerificationSummary = z.infer<typeof VerificationSummarySchema>;

export const PublicMetricsSchema = z.object({
  protected_requests_total: z.number(),
  receipts_verified_total: z.number(),
  enforcement_events_total: z.number(),
  active_tenants: z.number(),
  uptime_percent: z.number(),
  avg_request_latency_ms: z.number(),
  last_updated: z.string(),
  /* v1.45.0 additive fields (optional for backward compat) */
  receipts_written_total: z.number().optional(),
  uptime_seconds: z.number().optional(),
  requests_last_hour: z.number().optional(),
  receipts_written_last_hour: z.number().optional(),
  verification_summary: VerificationSummarySchema.optional(),
});

export type PublicMetrics = z.infer<typeof PublicMetricsSchema>;

// ── Fetch ────────────────────────────────────────────────────

export type PublicMetricsResult =
  | { ok: true; data: PublicMetrics }
  | { ok: false; error: string };

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_ATF_DASHBOARD_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_ATF_DASHBOARD_URL is not set. Cannot reach ATF metrics endpoint.",
    );
  }
  return url.replace(/\/+$/, "");
}

/**
 * ATF wraps every response in a standard envelope:
 *   { status: string, summary?: string, result: T, _meta?: object }
 *
 * If the parsed JSON matches this shape, return `result`.
 * Otherwise return the raw JSON for backward compatibility.
 */
function unwrapEnvelope(json: unknown): unknown {
  if (
    typeof json === "object" &&
    json !== null &&
    "result" in json &&
    "status" in json
  ) {
    return (json as Record<string, unknown>).result;
  }
  return json;
}

export async function fetchPublicMetrics(): Promise<PublicMetricsResult> {
  try {
    const base = getBaseUrl();
    const res = await fetch(`${base}/metrics/public-summary`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const json: unknown = await res.json();
    const payload = unwrapEnvelope(json);
    const parsed = PublicMetricsSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Schema validation failed: ${parsed.error.message}`,
      };
    }
    return { ok: true, data: parsed.data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown fetch error",
    };
  }
}
