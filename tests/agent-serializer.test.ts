import { describe, expect, it } from "vitest";
import {
  serializeDashboardSnapshot,
  serializeTenantSnapshot,
  AGENT_SCHEMA_VERSION,
  POLLING_INTERVAL_SECONDS,
} from "@/lib/agent-serializer";
import type { DashboardResult } from "@/lib/dashboard-client";
import type {
  SystemHealth,
  LiveEnforcement,
  LiveTrend,
  TenantsResponse,
  DashboardSummary,
  LiveKpiItem,
  TenantDetail,
} from "@/lib/dashboard-client";

/* ────────────────────────────────────────────────────────────────
 *  Agent Serializer - contract tests
 *
 *  Validates the agent-facing JSON contract produced by the
 *  shared serializer layer. Covers:
 *  - schema_version presence
 *  - freshness / provenance fields
 *  - capability boundary semantics
 *  - summary / queue / change shapes
 *  - tenant snapshot shape
 *  - unavailable / not-emitted states
 * ──────────────────────────────────────────────────────────── */

/* ── Fixtures ─────────────────────────────────────────────── */

const healthOk: DashboardResult<SystemHealth> = {
  ok: true,
  data: {
    status: "healthy",
    uptime_seconds: 86400,
    version: "1.45.0",
    started_at: "2026-03-07T12:00:00Z",
    checks: [
      { name: "postgres", status: "pass", latency_ms: 2.3 },
      { name: "redis", status: "pass", latency_ms: 0.8 },
    ],
  },
};

const healthDown: DashboardResult<SystemHealth> = {
  ok: true,
  data: {
    status: "down",
    uptime_seconds: 0,
    version: "1.45.0",
    started_at: "2026-03-09T00:00:00Z",
    checks: [
      { name: "postgres", status: "fail", latency_ms: 0 },
      { name: "redis", status: "fail", latency_ms: 0 },
    ],
  },
};

const healthUnavailable: DashboardResult<SystemHealth> = {
  ok: false,
  error: "health endpoint returned no data",
};

const enforcementOk: DashboardResult<LiveEnforcement> = {
  ok: true,
  data: {
    auth_failures_total: 12,
    rate_limit_rejections_total: 5,
    quota_violations_total: 3,
    reprovision_operations_total: 0,
  },
};



const enforcementUnavailable: DashboardResult<LiveEnforcement> = {
  ok: false,
  error: "Not available in dashboard summary",
};

const trendOk: DashboardResult<LiveTrend> = {
  ok: true,
  data: {
    requests_last_hour: 450,
    receipts_written_last_hour: 120,
    enforcement_last_hour: 8,
    requests_today: 5400,
    receipts_written_today: 1200,
  },
};



const trendUnavailable: DashboardResult<LiveTrend> = {
  ok: false,
  error: "Not available in dashboard summary",
};

const tenantsOk: DashboardResult<TenantsResponse> = {
  ok: true,
  data: {
    tenants: [
      {
        id: "t-1",
        name: "Acme Corp",
        status: "active",
        requests_24h: 3200,
        enforcements_24h: 5,
        avg_latency_ms: 4.1,
        last_seen: new Date().toISOString(),
      },
      {
        id: "t-2",
        name: "Suspended Inc",
        status: "suspended",
        requests_24h: 0,
        enforcements_24h: 80,
        avg_latency_ms: 0,
        last_seen: null,
      },
    ],
    total: 2,
  },
};

const tenantsUnavailable: DashboardResult<TenantsResponse> = {
  ok: false,
  error: "Upstream error",
};

const kpisOk: DashboardResult<LiveKpiItem[]> = {
  ok: true,
  data: [
    { label: "Requests (24h)", value: 5400, unit: "count" },
    { label: "Avg Latency", value: "4.2ms", unit: "ms" },
  ],
};

const summaryOk: DashboardResult<DashboardSummary> = {
  ok: true,
  data: { overall_status: "ok" },
};

/* Full bundle helper */
function makeBundle(overrides: Partial<Parameters<typeof serializeDashboardSnapshot>[0]> = {}) {
  return {
    health: healthOk,
    kpis: kpisOk,
    enforcement: enforcementOk,
    tenants: tenantsOk,
    summary: summaryOk,
    trend: trendOk,
    ...overrides,
  };
}

/* Tenant detail fixture */
const tenantDetail: TenantDetail = {
  id: "t-1",
  name: "Acme Corp",
  status: "active",
  plan_tier: "growth",
  created_at: "2026-01-15T00:00:00Z",
  last_seen: new Date().toISOString(),
  key_count: 3,
  quotas: [
    { key: "requests_per_minute", effective: 1000, source: "override", default_value: 500 },
    { key: "receipts_per_day", effective: 10000, source: "default", default_value: 10000 },
  ],
  usage_24h: { period: "24h", requests: 3200, enforcements: 5, blocks: 2, avg_latency_ms: 4.1 },
  usage_7d: { period: "7d", requests: 20000, enforcements: 30, blocks: 10, avg_latency_ms: 4.5 },
  posture_summary: {
    score: 85,
    label: "Strong",
    warnings: [],
  },
  metadata: { env: "production" },
};

const tenantSuspended: TenantDetail = {
  id: "t-2",
  name: "Suspended Inc",
  status: "suspended",
  plan_tier: "starter",
  created_at: "2026-02-01T00:00:00Z",
  last_seen: null,
  key_count: 1,
  quotas: [],
  usage_24h: { period: "24h", requests: 0, enforcements: 80, blocks: 80, avg_latency_ms: 0 },
  usage_7d: { period: "7d", requests: 500, enforcements: 200, blocks: 180, avg_latency_ms: 6 },
  posture_summary: {
    score: 25,
    label: "Needs Attention",
    warnings: [
      { code: "KEY_HYGIENE", severity: "critical", message: "Key rotation overdue", since: "2026-03-01T00:00:00Z" },
      { code: "QUOTA_PRESSURE", severity: "warn", message: "Quota utilization elevated", since: null },
    ],
  },
};

/* ── Dashboard Snapshot Tests ─────────────────────────────── */

describe("serializeDashboardSnapshot", () => {
  it("includes schema_version and generated_at", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect(snap.schema_version).toBe(AGENT_SCHEMA_VERSION);
    expect(snap.generated_at).toBeTruthy();
    expect(() => new Date(snap.generated_at)).not.toThrow();
  });

  it("includes polling_interval_seconds", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect(snap.polling_interval_seconds).toBe(POLLING_INTERVAL_SECONDS);
  });

  it("includes top-level freshness envelope", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect(snap.freshness).toBeDefined();
    expect(snap.freshness.freshness).toBeTruthy();
    expect(snap.freshness.provenance).toBeTruthy();
    expect(snap.freshness.provenance_label).toBeTruthy();
    expect(snap.freshness.generated_at).toBeTruthy();
    expect(snap.freshness.polling_interval_seconds).toBe(POLLING_INTERVAL_SECONDS);
  });

  it("derives summary with priority level and signals", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect(snap.summary.priority_level).toBeDefined();
    expect(["normal", "informational", "attention", "critical"]).toContain(snap.summary.priority_level);
    expect(snap.summary.priority_label).toBeTruthy();
    expect(Array.isArray(snap.summary.signals)).toBe(true);
    expect(snap.summary.signals.length).toBeGreaterThan(0);

    for (const signal of snap.summary.signals) {
      expect(signal.label).toBeTruthy();
      expect(signal.value).toBeTruthy();
      expect(["normal", "informational", "attention", "critical"]).toContain(signal.level);
    }
  });

  it("derives attention_queue as array", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect(Array.isArray(snap.attention_queue)).toBe(true);
    for (const item of snap.attention_queue) {
      expect(item.title).toBeTruthy();
      expect(item.reason).toBeTruthy();
      expect(["normal", "informational", "attention", "critical"]).toContain(item.level);
    }
  });

  it("derives top_changes as array", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect(Array.isArray(snap.top_changes)).toBe(true);
    for (const item of snap.top_changes) {
      expect(item.title).toBeTruthy();
      expect(item.direction).toBeTruthy();
      expect(item.detail).toBeTruthy();
    }
  });

  it("exposes health section with panel_status and checks", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect("available" in snap.health).toBe(false);
    if (!("available" in snap.health)) {
      expect(snap.health.status).toBe("healthy");
      expect(snap.health.panel_status).toBe("stable");
      expect(snap.health.checks_total).toBe(2);
      expect(snap.health.checks_passing).toBe(2);
      expect(snap.health.checks_failing).toBe(0);
      expect(snap.health.freshness).toBeDefined();
    }
  });

  it("exposes enforcement section with intensity", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect("available" in snap.enforcement).toBe(false);
    if (!("available" in snap.enforcement)) {
      expect(snap.enforcement.total).toBe(20);
      expect(snap.enforcement.intensity).toBeTruthy();
      expect(snap.enforcement.intensity_label).toBeTruthy();
      expect(snap.enforcement.categories).toBeDefined();
    }
  });

  it("exposes trends section with directional analysis", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect("available" in snap.trends).toBe(false);
    if (!("available" in snap.trends)) {
      expect(snap.trends.request_pace).toBeTruthy();
      expect(snap.trends.receipt_pace).toBeTruthy();
      expect(snap.trends.counters).toBeDefined();
      expect(snap.trends.freshness).toBeDefined();
    }
  });

  it("exposes tenants_overview with requires_review", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect("available" in snap.tenants_overview).toBe(false);
    if (!("available" in snap.tenants_overview)) {
      expect(snap.tenants_overview.total).toBe(2);
      expect(snap.tenants_overview.suspended).toBe(1);
      expect(Array.isArray(snap.tenants_overview.requires_review)).toBe(true);
      expect(snap.tenants_overview.requires_review).toContain("t-2");
    }
  });

  it("surfaces critical priority when health is down", () => {
    const snap = serializeDashboardSnapshot(makeBundle({ health: healthDown }));
    expect(snap.summary.priority_level).toBe("critical");
    expect(snap.attention_queue.some((q) => q.level === "critical")).toBe(true);
  });

  it("surfaces suspended tenant in attention queue", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    const suspended = snap.attention_queue.find((q) => q.title.includes("Suspended Inc"));
    expect(suspended).toBeDefined();
    expect(suspended?.level).toBe("critical");
  });
});

/* ── Capability boundary tests ────────────────────────────── */

describe("capability boundaries", () => {
  it("returns boundary for unavailable health", () => {
    const snap = serializeDashboardSnapshot(makeBundle({ health: healthUnavailable }));
    expect("available" in snap.health).toBe(true);
    if ("available" in snap.health) {
      expect(snap.health.available).toBe(false);
      expect(snap.health.reason).toBeTruthy();
    }
  });

  it("returns boundary for unavailable enforcement", () => {
    const snap = serializeDashboardSnapshot(makeBundle({ enforcement: enforcementUnavailable }));
    expect("available" in snap.enforcement).toBe(true);
    if ("available" in snap.enforcement) {
      expect(snap.enforcement.available).toBe(false);
    }
  });

  it("returns boundary for unavailable trends", () => {
    const snap = serializeDashboardSnapshot(makeBundle({ trend: trendUnavailable }));
    expect("available" in snap.trends).toBe(true);
    if ("available" in snap.trends) {
      expect(snap.trends.available).toBe(false);
    }
  });

  it("returns boundary for unavailable tenants", () => {
    const snap = serializeDashboardSnapshot(makeBundle({ tenants: tenantsUnavailable }));
    expect("available" in snap.tenants_overview).toBe(true);
    if ("available" in snap.tenants_overview) {
      expect(snap.tenants_overview.available).toBe(false);
    }
  });

  it("handles all-unavailable gracefully", () => {
    const snap = serializeDashboardSnapshot({
      health: healthUnavailable,
      kpis: { ok: false, error: "unavailable" },
      enforcement: enforcementUnavailable,
      tenants: tenantsUnavailable,
      summary: { ok: false, error: "unavailable" },
      trend: trendUnavailable,
    });
    expect(snap.schema_version).toBe(AGENT_SCHEMA_VERSION);
    expect(snap.summary.signals.length).toBeGreaterThan(0);
    expect("available" in snap.health).toBe(true);
    expect("available" in snap.enforcement).toBe(true);
    expect("available" in snap.trends).toBe(true);
    expect("available" in snap.tenants_overview).toBe(true);
  });
});

/* ── Tenant Snapshot Tests ────────────────────────────────── */

describe("serializeTenantSnapshot", () => {
  it("includes schema_version and freshness", () => {
    const snap = serializeTenantSnapshot(tenantDetail);
    expect(snap.schema_version).toBe(AGENT_SCHEMA_VERSION);
    expect(snap.generated_at).toBeTruthy();
    expect(snap.freshness).toBeDefined();
    expect(snap.freshness.freshness).toBeTruthy();
    expect(snap.freshness.provenance).toBe("derived");
  });

  it("exposes tenant identity and recency", () => {
    const snap = serializeTenantSnapshot(tenantDetail);
    expect(snap.tenant.id).toBe("t-1");
    expect(snap.tenant.name).toBe("Acme Corp");
    expect(snap.tenant.status).toBe("active");
    expect(snap.tenant.recency).toBeTruthy();
    expect(snap.tenant.recency_label).toBeTruthy();
  });

  it("derives operator summary with signals", () => {
    const snap = serializeTenantSnapshot(tenantDetail);
    expect(snap.operator_summary.priority_level).toBeDefined();
    expect(snap.operator_summary.signals.length).toBeGreaterThan(0);
    for (const s of snap.operator_summary.signals) {
      expect(s.label).toBeTruthy();
      expect(s.value).toBeTruthy();
      expect(["normal", "informational", "attention", "critical"]).toContain(s.level);
    }
  });

  it("exposes usage with delta directions", () => {
    const snap = serializeTenantSnapshot(tenantDetail);
    expect(snap.usage.period_24h.requests).toBe(3200);
    expect(snap.usage.period_7d.requests).toBe(20000);
    expect(snap.usage.request_delta).toBeTruthy();
    expect(snap.usage.request_delta_label).toBeDefined();
  });

  it("exposes quota entries with pressure", () => {
    const snap = serializeTenantSnapshot(tenantDetail);
    expect(snap.quotas.entries.length).toBe(2);
    expect(snap.quotas.entries[0].source).toBe("override");
    expect(typeof snap.quotas.any_pressure).toBe("boolean");
  });

  it("exposes posture with panel_status and evidence", () => {
    const snap = serializeTenantSnapshot(tenantDetail);
    expect(snap.posture.score).toBe(85);
    expect(snap.posture.label).toBe("Strong");
    expect(snap.posture.panel_status).toBe("stable");
    expect(snap.posture.warnings).toHaveLength(0);
  });

  it("surfaces critical posture for suspended tenant", () => {
    const snap = serializeTenantSnapshot(tenantSuspended);
    expect(snap.operator_summary.priority_level).toBe("critical");
    expect(snap.posture.panel_status).toBe("degraded");
    expect(snap.posture.critical_count).toBe(1);
    expect(snap.posture.warn_count).toBe(1);
    expect(snap.posture.evidence).toBeTruthy();
    expect(snap.posture.warnings.length).toBe(2);
  });

  it("includes metadata when present", () => {
    const snap = serializeTenantSnapshot(tenantDetail);
    expect(snap.metadata).toEqual({ env: "production" });
  });

  it("returns null metadata when absent", () => {
    const noMeta = { ...tenantDetail, metadata: undefined };
    const snap = serializeTenantSnapshot(noMeta);
    expect(snap.metadata).toBeNull();
  });
});

/* ── Example response fixture (bot consumption test) ──────── */

describe("example bot consumption", () => {
  it("a bot can read the top summary line", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    const topSummary = `${snap.summary.priority_label}: ${snap.summary.signals[0]?.value}`;
    expect(topSummary).toBeTruthy();
    expect(typeof topSummary).toBe("string");
  });

  it("a bot can read the top queue item", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    if (snap.attention_queue.length > 0) {
      const top = snap.attention_queue[0];
      expect(top.title).toBeTruthy();
      expect(top.level).toBeTruthy();
      expect(top.reason).toBeTruthy();
    }
  });

  it("a bot can identify tenants requiring review", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    if (!("available" in snap.tenants_overview)) {
      const reviewIds = snap.tenants_overview.requires_review;
      expect(Array.isArray(reviewIds)).toBe(true);
      for (const id of reviewIds) {
        expect(typeof id).toBe("string");
      }
    }
  });

  it("a bot can detect unavailable states", () => {
    const snap = serializeDashboardSnapshot(makeBundle({ trend: trendUnavailable }));
    if ("available" in snap.trends) {
      expect(snap.trends.available).toBe(false);
      expect(typeof snap.trends.reason).toBe("string");
    }
  });

  it("response is JSON-serializable (no circular refs or functions)", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    const json = JSON.stringify(snap);
    expect(json).toBeTruthy();
    const parsed = JSON.parse(json);
    expect(parsed.schema_version).toBe(AGENT_SCHEMA_VERSION);
  });

  it("tenant response is JSON-serializable", () => {
    const snap = serializeTenantSnapshot(tenantDetail);
    const json = JSON.stringify(snap);
    expect(json).toBeTruthy();
    const parsed = JSON.parse(json);
    expect(parsed.schema_version).toBe(AGENT_SCHEMA_VERSION);
  });
});

/* ── Automation decision helpers - Dashboard ──────────────── */

describe("dashboard automation helpers", () => {
  it("all-clear dashboard has idle automation state", () => {
    const clearBundle = makeBundle({
      enforcement: {
        ok: true,
        data: {
          auth_failures_total: 0,
          rate_limit_rejections_total: 0,
          quota_violations_total: 0,
          reprovision_operations_total: 0,
        },
      },
      tenants: {
        ok: true,
        data: {
          tenants: [
            {
              id: "t-clean",
              name: "Clean Corp",
              status: "active",
              requests_24h: 100,
              enforcements_24h: 0,
              avg_latency_ms: 3,
              last_seen: new Date().toISOString(),
            },
          ],
          total: 1,
        },
      },
    });
    const snap = serializeDashboardSnapshot(clearBundle);
    expect(snap.automation).toBeDefined();
    expect(snap.automation.requires_review).toBe(false);
    expect(snap.automation.is_offline).toBe(false);
    expect(snap.automation.is_degraded).toBe(false);
    expect(snap.automation.has_enforcement_activity).toBe(false);
  });

  it("review-required dashboard sets requires_review", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    // Default bundle has a suspended tenant, which triggers attention
    expect(snap.automation).toBeDefined();
    expect(typeof snap.automation.requires_review).toBe("boolean");
    expect(typeof snap.automation.has_persistent_warning).toBe("boolean");
    // Suspended tenant causes critical queue item
    expect(snap.automation.has_persistent_warning).toBe(true);
  });

  it("degraded health sets is_degraded", () => {
    const degradedHealth: DashboardResult<SystemHealth> = {
      ok: true,
      data: {
        status: "degraded",
        uptime_seconds: 3600,
        version: "1.45.0",
        started_at: "2026-03-09T00:00:00Z",
        checks: [
          { name: "postgres", status: "pass", latency_ms: 2 },
          { name: "redis", status: "warn", latency_ms: 50 },
        ],
      },
    };
    const snap = serializeDashboardSnapshot(makeBundle({ health: degradedHealth }));
    expect(snap.automation.is_degraded).toBe(true);
    expect(snap.automation.is_offline).toBe(false);
  });

  it("offline health sets is_offline", () => {
    const snap = serializeDashboardSnapshot(makeBundle({ health: healthDown }));
    expect(snap.automation.is_offline).toBe(true);
    expect(snap.automation.is_degraded).toBe(false);
  });

  it("has_enforcement_activity is true when enforcement total > 0", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect(snap.automation.has_enforcement_activity).toBe(true);
  });

  it("has_recent_activity reflects trend counters", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect(snap.automation.has_recent_activity).toBe(true);

    const noTrend = serializeDashboardSnapshot(makeBundle({ trend: trendUnavailable }));
    expect(noTrend.automation.has_recent_activity).toBe(false);
  });

  it("all-unavailable dashboard has safe automation defaults", () => {
    const snap = serializeDashboardSnapshot({
      health: healthUnavailable,
      kpis: { ok: false, error: "unavailable" },
      enforcement: enforcementUnavailable,
      tenants: tenantsUnavailable,
      summary: { ok: false, error: "unavailable" },
      trend: trendUnavailable,
    });
    expect(snap.automation).toBeDefined();
    expect(snap.automation.is_offline).toBe(false);
    expect(snap.automation.is_degraded).toBe(false);
    expect(snap.automation.has_enforcement_activity).toBe(false);
    expect(snap.automation.has_recent_activity).toBe(false);
  });

  it("automation fields are all booleans", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    for (const [, val] of Object.entries(snap.automation)) {
      expect(typeof val).toBe("boolean");
    }
  });
});

/* ── Automation decision helpers - Tenant ─────────────────── */

describe("tenant automation helpers", () => {
  it("active tenant with enforcement has correct automation flags", () => {
    const snap = serializeTenantSnapshot(tenantDetail);
    expect(snap.automation).toBeDefined();
    // tenantDetail has 5 enforcement events in 24h with increasing delta,
    // which triggers attention-level signal -> requires_review true
    expect(snap.automation.requires_review).toBe(true);
    expect(snap.automation.is_suspended).toBe(false);
    // quotas: 3200 requests vs 1000 effective = 320% pressure
    expect(snap.automation.has_quota_pressure).toBe(true);
    expect(snap.automation.has_posture_warnings).toBe(false);
    expect(snap.automation.is_idle).toBe(false);
  });

  it("suspended tenant sets is_suspended and requires_review", () => {
    const snap = serializeTenantSnapshot(tenantSuspended);
    expect(snap.automation.is_suspended).toBe(true);
    expect(snap.automation.requires_review).toBe(true);
    expect(snap.automation.has_posture_warnings).toBe(true);
    expect(snap.automation.has_enforcement_activity).toBe(true);
    expect(snap.automation.is_idle).toBe(true); // 0 requests in 24h
  });

  it("tenant with quota pressure flags has_quota_pressure", () => {
    const highPressureTenant: TenantDetail = {
      ...tenantDetail,
      usage_24h: { period: "24h", requests: 950, enforcements: 0, blocks: 0, avg_latency_ms: 3 },
      quotas: [
        { key: "requests_per_minute", effective: 1000, source: "override", default_value: 500 },
      ],
    };
    const snap = serializeTenantSnapshot(highPressureTenant);
    expect(snap.automation.has_quota_pressure).toBe(true);
  });

  it("idle tenant with no requests sets is_idle", () => {
    const idleTenant: TenantDetail = {
      ...tenantDetail,
      status: "inactive",
      usage_24h: { period: "24h", requests: 0, enforcements: 0, blocks: 0, avg_latency_ms: 0 },
    };
    const snap = serializeTenantSnapshot(idleTenant);
    expect(snap.automation.is_idle).toBe(true);
    expect(snap.automation.has_enforcement_activity).toBe(false);
  });

  it("automation fields are all booleans", () => {
    const snap = serializeTenantSnapshot(tenantDetail);
    for (const [, val] of Object.entries(snap.automation)) {
      expect(typeof val).toBe("boolean");
    }
  });
});

/* ── Canonical enum validation ────────────────────────────── */

describe("canonical enum stability", () => {
  const ATTENTION_LEVELS = ["normal", "informational", "attention", "critical"];
  const PANEL_STATUSES = ["stable", "review", "idle", "reduced", "degraded", "offline"];
  const TREND_DIRECTIONS = ["increasing", "decreasing", "unchanged", "newly-active", "persistent", "unavailable"];
  const FRESHNESS_STATES = ["fresh", "delayed", "stale", "unavailable"];
  const PROVENANCE_TYPES = ["direct", "derived", "capability-gated", "not-emitted"];
  const INTENSITY_VALUES = ["idle", "background", "elevated", "concentrated"];
  const SECTION_TARGETS = ["health", "enforcement", "tenants", "activity"];

  it("summary.priority_level uses canonical attention enum", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect(ATTENTION_LEVELS).toContain(snap.summary.priority_level);
  });

  it("health.panel_status uses canonical panel status enum", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    if (!("available" in snap.health)) {
      expect(PANEL_STATUSES).toContain(snap.health.panel_status);
    }
  });

  it("enforcement.intensity uses canonical intensity enum", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    if (!("available" in snap.enforcement)) {
      expect(INTENSITY_VALUES).toContain(snap.enforcement.intensity);
    }
  });

  it("trend directions use canonical trend enum", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    if (!("available" in snap.trends)) {
      expect(TREND_DIRECTIONS).toContain(snap.trends.request_pace);
      expect(TREND_DIRECTIONS).toContain(snap.trends.enforcement_presence);
      expect(TREND_DIRECTIONS).toContain(snap.trends.receipt_pace);
    }
  });

  it("freshness uses canonical freshness enum", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect(FRESHNESS_STATES).toContain(snap.freshness.freshness);
  });

  it("provenance uses canonical provenance enum", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    expect(PROVENANCE_TYPES).toContain(snap.freshness.provenance);
  });

  it("queue items target uses canonical section enum", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    for (const item of snap.attention_queue) {
      if (item.target) {
        expect(SECTION_TARGETS).toContain(item.target);
      }
    }
  });

  it("tenant posture.panel_status uses canonical panel status", () => {
    const snap = serializeTenantSnapshot(tenantDetail);
    expect(PANEL_STATUSES).toContain(snap.posture.panel_status);
  });

  it("tenant usage deltas use canonical trend enum", () => {
    const snap = serializeTenantSnapshot(tenantDetail);
    expect(TREND_DIRECTIONS).toContain(snap.usage.request_delta);
    expect(TREND_DIRECTIONS).toContain(snap.usage.enforcement_delta);
  });

  it("schema_version is 1.1.0", () => {
    expect(AGENT_SCHEMA_VERSION).toBe("1.1.0");
  });
});

/* ── Response fixture scenarios ───────────────────────────── */

describe("response fixture scenarios", () => {
  it("all-clear dashboard: healthy, no enforcement, no warnings", () => {
    const clearBundle = makeBundle({
      enforcement: {
        ok: true,
        data: {
          auth_failures_total: 0,
          rate_limit_rejections_total: 0,
          quota_violations_total: 0,
          reprovision_operations_total: 0,
        },
      },
      tenants: {
        ok: true,
        data: {
          tenants: [
            {
              id: "t-ok",
              name: "Healthy Co",
              status: "active",
              requests_24h: 500,
              enforcements_24h: 0,
              avg_latency_ms: 2,
              last_seen: new Date().toISOString(),
            },
          ],
          total: 1,
        },
      },
    });
    const snap = serializeDashboardSnapshot(clearBundle);
    expect(snap.automation.requires_review).toBe(false);
    // All-clear with no queue items -> is_idle true
    expect(snap.automation.is_idle).toBe(true);
    expect(snap.automation.is_degraded).toBe(false);
    expect(snap.automation.is_offline).toBe(false);
    if (!("available" in snap.health)) {
      expect(snap.health.panel_status).toBe("stable");
    }
  });

  it("review-required dashboard: suspended tenant triggers review", () => {
    const snap = serializeDashboardSnapshot(makeBundle());
    // Default fixtures include a suspended tenant
    if (!("available" in snap.tenants_overview)) {
      expect(snap.tenants_overview.requires_review.length).toBeGreaterThan(0);
    }
    expect(snap.automation.has_persistent_warning).toBe(true);
  });

  it("degraded dashboard: health warns, everything else ok", () => {
    const degradedHealth: DashboardResult<SystemHealth> = {
      ok: true,
      data: {
        status: "degraded",
        uptime_seconds: 7200,
        version: "1.45.0",
        started_at: "2026-03-09T00:00:00Z",
        checks: [
          { name: "postgres", status: "pass", latency_ms: 2 },
          { name: "redis", status: "warn", latency_ms: 40 },
        ],
      },
    };
    const snap = serializeDashboardSnapshot(
      makeBundle({
        health: degradedHealth,
        enforcement: {
          ok: true,
          data: {
            auth_failures_total: 0,
            rate_limit_rejections_total: 0,
            quota_violations_total: 0,
            reprovision_operations_total: 0,
          },
        },
      }),
    );
    expect(snap.automation.is_degraded).toBe(true);
    expect(snap.automation.is_offline).toBe(false);
    if (!("available" in snap.health)) {
      expect(snap.health.panel_status).toBe("reduced");
    }
  });

  it("tenant with quota pressure and posture warnings", () => {
    const pressureTenant: TenantDetail = {
      ...tenantDetail,
      usage_24h: { period: "24h", requests: 900, enforcements: 15, blocks: 5, avg_latency_ms: 8 },
      quotas: [
        { key: "requests_per_minute", effective: 1000, source: "override", default_value: 500 },
      ],
      posture_summary: {
        score: 55,
        label: "Needs Attention",
        warnings: [
          { code: "LATENCY_HIGH", severity: "warn", message: "Average latency above threshold", since: "2026-03-08T00:00:00Z" },
        ],
      },
    };
    const snap = serializeTenantSnapshot(pressureTenant);
    expect(snap.automation.has_quota_pressure).toBe(true);
    expect(snap.automation.has_posture_warnings).toBe(true);
    expect(snap.automation.has_enforcement_activity).toBe(true);
    expect(snap.automation.is_idle).toBe(false);
    expect(snap.posture.panel_status).toBe("review");
  });
});
