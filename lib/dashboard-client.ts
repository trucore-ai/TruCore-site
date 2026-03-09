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

// ── Trend Snapshot (v1.45.0) ─────────────────────────────────

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

export const DashboardSummarySchema = z.object({
  trend: TrendSnapshotSchema,
});

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
    const parsed = schema.safeParse(json);
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
