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
  /* v1.47.0 premium analytics entitlement (optional for backward compat) */
  premium_analytics: z
    .object({
      enabled: z.boolean(),
      state: z.string(),
      source: z.string(),
      expires_at: z.number().optional(),
    })
    .optional(),
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

// ── Adoption funnel schemas ──────────────────────────────────
//
// Platform-scoped adoption metrics from /dashboard/adoption.
// Read-only, operator-facing, never exposed to tenant users.

export const TenantActivationSnapshotSchema = z.object({
  tenant_id: z.string(),
  display_name: z.string(),
  plan_tier: z.string(),
  status: z.string(),
  created_at: z.string().nullable(),
  last_activity_ts: z.string().nullable(),
  has_first_protect: z.boolean(),
  has_first_receipt: z.boolean(),
  has_first_verify: z.boolean(),
  requests_total: z.number(),
  receipts_written_total: z.number(),
  receipts_verified_total: z.number(),
  // Refined adoption fields (v1.46)
  first_seen_at: z.string().nullable().optional(),
  last_seen_at: z.string().nullable().optional(),
  protect_count: z.number().optional(),
  receipt_count: z.number().optional(),
  verify_count: z.number().optional(),
  repeat_active_7d: z.boolean().optional(),
  dominant_source: z.string().optional(),
  source_mix: z.record(z.number()).optional(),
  activation_stage: z.string().optional(),
  dormant_days: z.number().optional(),
  stalled_stage: z.string().optional(),
  // Premium analytics entitlement (v1.47)
  premium_analytics_state: z.string().optional(),
});

export const AdoptionFunnelSchema = z.object({
  total_tenants: z.number(),
  active_tenants: z.number(),
  suspended_tenants: z.number(),
  tenants_with_requests: z.number(),
  tenants_with_receipts: z.number(),
  tenants_with_verifies: z.number(),
  repeat_active_tenants: z.number().optional(),
  stalled_tenants: z.number().optional(),
  dormant_tenants: z.number().optional(),
  total_api_keys_active: z.number(),
  total_requests: z.number(),
  total_receipts_written: z.number(),
  total_receipts_verified: z.number(),
  endpoint_mix: z.record(z.number()),
  source_summary: z.record(z.number()).optional(),
  tenant_snapshots: z.array(TenantActivationSnapshotSchema),
});

// ── Latency metrics schemas ──────────────────────────────────
//
// Validated shape for /v1/metrics/latency.
// Covers overall percentiles, per-mode breakdown, and cache
// effectiveness indicators.

export const PercentileSchema = z.object({
  p50: z.number(),
  p95: z.number(),
  p99: z.number(),
});

export const LatencyOverallSchema = z
  .object({
    total_ms: PercentileSchema,
    policy_eval_ms: PercentileSchema,
    rpc_total_time_ms: PercentileSchema,
    cache_lookup_ms: PercentileSchema.optional(),
    eval_cache_lookup_ms: PercentileSchema.optional(),
    parallel_read_group_ms: PercentileSchema.optional(),
    policy_package_build_ms: PercentileSchema.optional(),
    policy_package_validate_ms: PercentileSchema.optional(),
  })
  .passthrough();

export const LatencyModeBreakdownSchema = z
  .object({
    observation_count: z.number(),
    total_ms: PercentileSchema,
    cache_hits: z.number(),
    eval_cache_hits: z.number(),
    turbo_fast_path_hits: z.number(),
  })
  .passthrough();

export const LatencyCacheSummarySchema = z
  .object({
    cache_hits: z.number(),
    cache_misses: z.number(),
    eval_cache_hits: z.number(),
    turbo_fast_path_hits: z.number(),
    rpc_calls_avg: z.number().optional(),
  })
  .passthrough();

export const LatencyMetricsSchema = z
  .object({
    observation_count: z.number(),
    window: z.string().optional(),
    overall: LatencyOverallSchema,
    by_mode: z.record(LatencyModeBreakdownSchema).optional(),
    cache_summary: LatencyCacheSummarySchema.optional(),
  })
  .passthrough();

// ── Types ────────────────────────────────────────────────────

export type Percentile = z.infer<typeof PercentileSchema>;
export type LatencyOverall = z.infer<typeof LatencyOverallSchema>;
export type LatencyModeBreakdown = z.infer<typeof LatencyModeBreakdownSchema>;
export type LatencyCacheSummary = z.infer<typeof LatencyCacheSummarySchema>;
export type LatencyMetrics = z.infer<typeof LatencyMetricsSchema>;
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
export type TenantActivationSnapshot = z.infer<typeof TenantActivationSnapshotSchema>;
export type AdoptionFunnel = z.infer<typeof AdoptionFunnelSchema>;

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

export function fetchAdoption(): Promise<DashboardResult<AdoptionFunnel>> {
  return dashboardFetch("/dashboard/adoption", AdoptionFunnelSchema);
}

export function fetchLatencyMetrics(): Promise<DashboardResult<LatencyMetrics>> {
  return dashboardFetch("/v1/metrics/latency", LatencyMetricsSchema);
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
  adoption: DashboardResult<AdoptionFunnel>;
}> {
  const [summary, tenants, adoption] = await Promise.all([
    fetchDashboardSummary(),
    fetchTenants(),
    fetchAdoption(),
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
    adoption,
  };
}

// ── Admin user management ────────────────────────────────────

export const AdminUserSummarySchema = z.object({
  user_id: z.string(),
  email: z.string(),
  tenant_id: z.string(),
  created_at: z.number(),
  email_verified: z.boolean(),
  email_verified_at: z.number().nullable(),
  email_verification_sent_at: z.number().nullable(),
  password_reset_sent_at: z.number().nullable(),
});

export const AdminUserListSchema = z.object({
  users: z.array(AdminUserSummarySchema),
  count: z.number(),
});

export const AdminUserDetailSchema = z.object({
  user: z.object({
    user_id: z.string(),
    email: z.string(),
    tenant_id: z.string(),
    created_at: z.number(),
    email_verified: z.boolean(),
    email_verified_at: z.number().nullable(),
    email_verification_sent_at: z.number().nullable(),
    has_pending_verification_token: z.boolean(),
    verification_token_expires_at: z.number().nullable(),
    password_reset_sent_at: z.number().nullable(),
    password_reset_expires_at: z.number().nullable(),
    password_reset_used_at: z.number().nullable(),
    has_pending_reset_token: z.boolean(),
  }),
});

export type AdminUserSummary = z.infer<typeof AdminUserSummarySchema>;
export type AdminUserList = z.infer<typeof AdminUserListSchema>;
export type AdminUserDetail = z.infer<typeof AdminUserDetailSchema>;

export function fetchAdminUsers(
  email?: string,
  limit = 50,
): Promise<DashboardResult<AdminUserList>> {
  const params = new URLSearchParams();
  if (email) params.set("email", email);
  params.set("limit", String(limit));
  return dashboardFetch(
    `/admin/users?${params.toString()}`,
    AdminUserListSchema,
  );
}

export function fetchAdminUserDetail(
  userId: string,
): Promise<DashboardResult<AdminUserDetail>> {
  return dashboardFetch(
    `/admin/users/${encodeURIComponent(userId)}`,
    AdminUserDetailSchema,
  );
}

/**
 * Call an admin user action endpoint (POST). Returns { ok, error? }.
 * Used for: resend verification, revoke verification, revoke reset.
 */
export async function adminUserAction(
  userId: string,
  action: "verification/resend" | "verification/revoke-pending" | "password-reset/revoke-pending",
): Promise<{ ok: boolean; error?: string }> {
  try {
    const base = getBaseUrl();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const apiKey = process.env.ATF_API_KEY;
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }
    const res = await fetch(
      `${base}/admin/users/${encodeURIComponent(userId)}/${action}`,
      { method: "POST", headers, cache: "no-store" },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ── Feature Catalog ──────────────────────────────────────────

export const FeatureEntrySchema = z.object({
  feature_key: z.string(),
  surface: z.enum(["api", "cli", "plugin", "other"]),
  title: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  visibility: z.enum(["hidden", "visible", "gated"]),
  required_plan: z.enum(["free", "pro", "enterprise"]),
  access_mode: z.enum(["self_serve", "request_only", "admin_only"]),
  metered: z.boolean(),
  billing_dimension: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const AdminFeatureListSchema = z.object({
  features: z.array(FeatureEntrySchema),
  count: z.number(),
});

/** Public-facing feature entry (no tags/billing internals) */
export const PublicFeatureEntrySchema = z.object({
  feature_key: z.string(),
  surface: z.enum(["api", "cli", "plugin", "other"]),
  title: z.string(),
  description: z.string(),
  visibility: z.enum(["hidden", "visible", "gated"]),
  required_plan: z.enum(["free", "pro", "enterprise"]),
  access_mode: z.enum(["self_serve", "request_only", "admin_only"]),
  metered: z.boolean(),
});

export const PublicFeatureCatalogSchema = z.object({
  features: z.array(PublicFeatureEntrySchema),
  count: z.number(),
});

export type FeatureEntry = z.infer<typeof FeatureEntrySchema>;
export type AdminFeatureList = z.infer<typeof AdminFeatureListSchema>;
export type PublicFeatureEntry = z.infer<typeof PublicFeatureEntrySchema>;
export type PublicFeatureCatalog = z.infer<typeof PublicFeatureCatalogSchema>;

export function fetchAdminFeatures(
  surface?: string,
): Promise<DashboardResult<AdminFeatureList>> {
  const params = new URLSearchParams();
  if (surface) params.set("surface", surface);
  const qs = params.toString();
  return dashboardFetch(
    `/admin/features${qs ? `?${qs}` : ""}`,
    AdminFeatureListSchema,
  );
}

export function fetchAdminFeatureDetail(
  featureKey: string,
): Promise<DashboardResult<{ feature: FeatureEntry }>> {
  return dashboardFetch(
    `/admin/features/${encodeURIComponent(featureKey)}`,
    z.object({ feature: FeatureEntrySchema }),
  );
}

export async function updateAdminFeature(
  featureKey: string,
  patch: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const base = getBaseUrl();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const apiKey = process.env.ATF_API_KEY;
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }
    const res = await fetch(
      `${base}/admin/features/${encodeURIComponent(featureKey)}`,
      { method: "POST", headers, body: JSON.stringify(patch), cache: "no-store" },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export function fetchPublicFeatureCatalog(
  surface?: string,
): Promise<DashboardResult<PublicFeatureCatalog>> {
  const params = new URLSearchParams();
  if (surface) params.set("surface", surface);
  const qs = params.toString();
  return dashboardFetch(
    `/features/catalog${qs ? `?${qs}` : ""}`,
    PublicFeatureCatalogSchema,
  );
}

// ── Admin Upgrade Requests ───────────────────────────────────

export const UpgradeRequestSchema = z.object({
  request_id: z.string(),
  tenant_id: z.string(),
  user_id: z.string(),
  requested_plan: z.string(),
  requested_features: z.array(z.string()),
  reason: z.string(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]),
  created_at: z.number(),
  reviewed_at: z.number(),
  reviewed_by: z.string(),
  review_note: z.string(),
});

export const AdminUpgradeListSchema = z.object({
  requests: z.array(UpgradeRequestSchema),
  count: z.number(),
});

export type UpgradeRequestEntry = z.infer<typeof UpgradeRequestSchema>;
export type AdminUpgradeList = z.infer<typeof AdminUpgradeListSchema>;

export function fetchAdminUpgradeRequests(
  status?: string,
  requestedPlan?: string,
): Promise<DashboardResult<AdminUpgradeList>> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (requestedPlan) params.set("requested_plan", requestedPlan);
  const qs = params.toString();
  return dashboardFetch(
    `/admin/upgrades${qs ? `?${qs}` : ""}`,
    AdminUpgradeListSchema,
  );
}

export function fetchAdminUpgradeDetail(
  requestId: string,
): Promise<DashboardResult<{ request: UpgradeRequestEntry }>> {
  return dashboardFetch(
    `/admin/upgrades/${encodeURIComponent(requestId)}`,
    z.object({ request: UpgradeRequestSchema }),
  );
}

export async function adminUpgradeAction(
  requestId: string,
  action: "approve" | "reject",
  note = "",
): Promise<{ ok: boolean; error?: string }> {
  try {
    const base = getBaseUrl();
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    const apiKey = process.env.ATF_API_KEY;
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }
    const res = await fetch(
      `${base}/admin/upgrades/${encodeURIComponent(requestId)}/${action}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ note }),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
