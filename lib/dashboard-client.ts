import { z } from "zod";

/* ────────────────────────────────────────────────────────────────
 *  ATF Dashboard Client
 *
 *  Typed client for the ATF /dashboard/* REST endpoints.
 *  Each endpoint is validated with Zod so the UI layer can
 *  trust the shape at compile time and degrade gracefully at
 *  runtime when the contract drifts.
 *
 *  The base URL is read from NEXT_PUBLIC_ATF_DASHBOARD_URL.
 *  Protected dashboard requests are authenticated with the
 *  server-only ATF_API_KEY env var (sent as x-api-key header).
 *
 *  ATF responses are wrapped in a standard envelope:
 *    { status, summary?, result, _meta? }
 *  The fetch helper unwraps the envelope automatically and
 *  validates `result` against the expected Zod schema.
 *
 *  All fetches set a 5 s cache window to match the ATF-side
 *  caching contract for UI polling.
 * ──────────────────────────────────────────────────────────── */

// ── Env ──────────────────────────────────────────────────────

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_ATF_DASHBOARD_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_ATF_DASHBOARD_URL is not set. Cannot reach ATF dashboard endpoints.",
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

// ── Schemas ──────────────────────────────────────────────────

export const SystemHealthSchema = z.object({
  status: z.enum(["healthy", "degraded", "down"]),
  uptime_seconds: z.number(),
  version: z.string(),
  started_at: z.string(),
  checks: z.array(
    z.object({
      name: z.string(),
      status: z.enum(["pass", "warn", "fail"]),
      latency_ms: z.number(),
      message: z.string().optional(),
    }),
  ),
});

export const KpiSummarySchema = z.object({
  total_requests_24h: z.number(),
  total_enforcements_24h: z.number(),
  active_tenants: z.number(),
  avg_latency_ms: z.number(),
  p99_latency_ms: z.number(),
  receipts_issued_24h: z.number(),
  uptime_pct: z.number(),
  error_rate_pct: z.number(),
});

export const EnforcementOverviewSchema = z.object({
  total_evaluated: z.number(),
  total_blocked: z.number(),
  total_allowed: z.number(),
  total_flagged: z.number(),
  block_rate_pct: z.number(),
  top_rules: z.array(
    z.object({
      rule: z.string(),
      hits: z.number(),
      action: z.enum(["block", "flag", "allow"]),
    }),
  ),
});

export const ActivityPointSchema = z.object({
  timestamp: z.string(),
  requests: z.number(),
  enforcements: z.number(),
  avg_latency_ms: z.number(),
});

export const ActivityTrendsSchema = z.object({
  interval: z.string(),
  points: z.array(ActivityPointSchema),
});

export const TenantSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["active", "inactive", "suspended"]),
  requests_24h: z.number(),
  enforcements_24h: z.number(),
  avg_latency_ms: z.number(),
  last_seen: z.string().nullable(),
});

export const TenantsResponseSchema = z.object({
  tenants: z.array(TenantSummarySchema),
  total: z.number(),
});

export const QuotaEntrySchema = z.object({
  key: z.string(),
  effective: z.number(),
  source: z.enum(["override", "env", "default"]),
  default_value: z.number(),
});

export const UsageBucketSchema = z.object({
  period: z.string(),
  requests: z.number(),
  enforcements: z.number(),
  blocks: z.number(),
  avg_latency_ms: z.number(),
});

export const PostureWarningSchema = z.object({
  code: z.string(),
  severity: z.enum(["info", "warn", "critical"]),
  message: z.string(),
  since: z.string().nullable(),
});

export const TenantDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["active", "inactive", "suspended"]),
  plan_tier: z.string(),
  created_at: z.string(),
  last_seen: z.string().nullable(),
  key_count: z.number(),
  quotas: z.array(QuotaEntrySchema),
  usage_24h: UsageBucketSchema,
  usage_7d: UsageBucketSchema,
  posture_summary: z.object({
    score: z.number(),
    label: z.string(),
    warnings: z.array(PostureWarningSchema),
  }),
  metadata: z.record(z.string()).optional(),
  /* v1.45.0 additive fields (optional for backward compat) */
  requests_today: z.number().optional(),
  requests_last_hour: z.number().optional(),
  receipts_written_today: z.number().optional(),
  last_activity_ts: z.string().nullable().optional(),
});

// ── Legacy Trend Snapshot (kept for backward compat) ─────────

export const TrendBucketSchema = z.object({
  requests: z.number(),
  enforcements: z.number(),
  blocks: z.number(),
  avg_latency_ms: z.number(),
  receipts_issued: z.number(),
});

export const TrendSnapshotSchema = z.object({
  rolling_hour: TrendBucketSchema,
  rolling_hour_prev: TrendBucketSchema,
  daily: TrendBucketSchema,
  daily_prev: TrendBucketSchema,
});

// ── Live ATF /dashboard/summary schemas ──────────────────────
//
// These match the production ATF contract (v1.45+).
// The summary endpoint returns a flat result object with
// overall_status, build, startup, backends, enforcement,
// kpis (array), trend (flat counters), and warnings.

export const LiveKpiItemSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
  trend: z.string().optional(),
});

export const LiveEnforcementSchema = z
  .object({
    auth_failures_total: z.number(),
    rate_limit_rejections_total: z.number(),
    quota_violations_total: z.number(),
    reprovision_operations_total: z.number(),
  })
  .passthrough();

export const LiveTrendSchema = z
  .object({
    requests_last_hour: z.number(),
    receipts_written_last_hour: z.number(),
    enforcement_last_hour: z.number(),
    requests_today: z.number(),
    receipts_written_today: z.number(),
  })
  .passthrough();

export const DashboardSummarySchema = z
  .object({
    overall_status: z.string().optional(),
    build: z.unknown().optional(),
    startup: z.unknown().optional(),
    backends: z.unknown().optional(),
    enforcement: LiveEnforcementSchema.optional(),
    kpis: z.array(LiveKpiItemSchema).optional(),
    trend: LiveTrendSchema.optional(),
    warnings: z.array(z.unknown()).optional(),
  })
  .passthrough();

// ── Types ────────────────────────────────────────────────────

export type SystemHealth = z.infer<typeof SystemHealthSchema>;
export type KpiSummary = z.infer<typeof KpiSummarySchema>;
export type EnforcementOverview = z.infer<typeof EnforcementOverviewSchema>;
export type ActivityTrends = z.infer<typeof ActivityTrendsSchema>;
export type ActivityPoint = z.infer<typeof ActivityPointSchema>;
export type TenantSummary = z.infer<typeof TenantSummarySchema>;
export type TenantsResponse = z.infer<typeof TenantsResponseSchema>;
export type QuotaEntry = z.infer<typeof QuotaEntrySchema>;
export type UsageBucket = z.infer<typeof UsageBucketSchema>;
export type PostureWarning = z.infer<typeof PostureWarningSchema>;
export type TenantDetail = z.infer<typeof TenantDetailSchema>;
export type TrendBucket = z.infer<typeof TrendBucketSchema>;
export type TrendSnapshot = z.infer<typeof TrendSnapshotSchema>;
export type LiveKpiItem = z.infer<typeof LiveKpiItemSchema>;
export type LiveEnforcement = z.infer<typeof LiveEnforcementSchema>;
export type LiveTrend = z.infer<typeof LiveTrendSchema>;
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;

// ── Fetch helper ─────────────────────────────────────────────

export type DashboardResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function dashboardFetch<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<DashboardResult<T>> {
  try {
    const base = getBaseUrl();
    const headers: Record<string, string> = { Accept: "application/json" };
    const apiKey = process.env.ATF_API_KEY;
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }
    const res = await fetch(`${base}${path}`, {
      next: { revalidate: 5 },
      headers,
    });
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const json: unknown = await res.json();
    const payload = unwrapEnvelope(json);
    const parsed = schema.safeParse(payload);
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

// ── Public API ───────────────────────────────────────────────

export function fetchHealth(): Promise<DashboardResult<SystemHealth>> {
  return dashboardFetch("/dashboard/health", SystemHealthSchema);
}

export function fetchKpis(): Promise<DashboardResult<KpiSummary>> {
  return dashboardFetch("/dashboard/kpis", KpiSummarySchema);
}

export function fetchEnforcement(): Promise<
  DashboardResult<EnforcementOverview>
> {
  return dashboardFetch("/dashboard/enforcement", EnforcementOverviewSchema);
}

export function fetchActivity(): Promise<DashboardResult<ActivityTrends>> {
  return dashboardFetch("/dashboard/activity", ActivityTrendsSchema);
}

export function fetchTenants(): Promise<DashboardResult<TenantsResponse>> {
  return dashboardFetch("/dashboard/tenants", TenantsResponseSchema);
}

export function fetchTenantDetail(
  tenantId: string,
): Promise<DashboardResult<TenantDetail>> {
  return dashboardFetch(
    `/dashboard/tenants/${encodeURIComponent(tenantId)}`,
    TenantDetailSchema,
  );
}

export function fetchDashboardSummary(): Promise<
  DashboardResult<DashboardSummary>
> {
  return dashboardFetch("/dashboard/summary", DashboardSummarySchema);
}

// ── Consolidated dashboard bundle ────────────────────────────

// ── Health adapter ────────────────────────────────────────────
//
// The live /dashboard/summary does not include a nested `health`
// object.  Instead it exposes top-level fields: overall_status,
// build, startup, and backends.  We adapt those into a
// SystemHealth shape so the HealthStrip component can render
// without changes.

function adaptHealthFromSummary(
  summary: DashboardResult<DashboardSummary>,
): DashboardResult<SystemHealth> {
  if (!summary.ok) return { ok: false, error: summary.error };
  const s = summary.data;

  const statusMap: Record<string, "healthy" | "degraded" | "down"> = {
    ok: "healthy",
    healthy: "healthy",
    degraded: "degraded",
    down: "down",
    error: "down",
  };

  const checks: SystemHealth["checks"] = [];
  if (s.backends && typeof s.backends === "object" && !Array.isArray(s.backends)) {
    for (const [name, val] of Object.entries(
      s.backends as Record<string, unknown>,
    )) {
      const isOk =
        val === "ok" ||
        val === "healthy" ||
        val === "pass" ||
        val === true;
      checks.push({ name, status: isOk ? "pass" : "warn", latency_ms: 0 });
    }
  }

  return {
    ok: true,
    data: {
      status:
        statusMap[String(s.overall_status ?? "").toLowerCase()] ?? "degraded",
      uptime_seconds: 0,
      version: typeof s.build === "string" ? s.build : "live",
      started_at:
        typeof s.startup === "string"
          ? s.startup
          : new Date().toISOString(),
      checks,
    },
  };
}

/**
 * Fetch a complete dashboard data bundle by calling the
 * consolidated /dashboard/summary endpoint (which is confirmed
 * live in production) plus /dashboard/tenants.
 *
 * Panel data is derived from the summary result:
 * - health: adapted from overall_status / build / backends
 * - kpis:   live kpis array of { label, value, unit, trend }
 * - enforcement: live enforcement counters
 * - trend:  live flat trend counters
 * - activity: not available in the summary endpoint
 * - tenants: from the separate /dashboard/tenants call
 */
export async function fetchFullDashboard(): Promise<{
  health: DashboardResult<SystemHealth>;
  kpis: DashboardResult<LiveKpiItem[]>;
  enforcement: DashboardResult<LiveEnforcement>;
  activity: DashboardResult<ActivityTrends>;
  tenants: DashboardResult<TenantsResponse>;
  summary: DashboardResult<DashboardSummary>;
  trend: DashboardResult<LiveTrend>;
}> {
  const [summary, tenants] = await Promise.all([
    fetchDashboardSummary(),
    fetchTenants(),
  ]);

  const derive = <T>(
    extractor: (s: DashboardSummary) => T | undefined,
  ): DashboardResult<T> => {
    if (!summary.ok) return { ok: false, error: summary.error };
    const data = extractor(summary.data);
    if (!data)
      return { ok: false, error: "Not available in dashboard summary" };
    return { ok: true, data };
  };

  return {
    health: adaptHealthFromSummary(summary),
    kpis: derive((s) => s.kpis),
    enforcement: derive((s) => s.enforcement),
    activity: {
      ok: false,
      error: "Activity trends not available in summary endpoint",
    },
    tenants,
    summary,
    trend: derive((s) => s.trend),
  };
}
