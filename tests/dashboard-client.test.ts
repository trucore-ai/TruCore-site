import { describe, expect, it } from "vitest";
import {
  SystemHealthSchema,
  KpiSummarySchema,
  EnforcementOverviewSchema,
  ActivityTrendsSchema,
  TenantsResponseSchema,
  DashboardSummarySchema,
  LiveKpiItemSchema,
  LiveEnforcementSchema,
  LiveTrendSchema,
  MonetizationSettingsSchema,
} from "@/lib/dashboard-client";

/* ────────────────────────────────────────────────────────────────
 *  Dashboard Client - schema contract tests
 *
 *  Validates that the Zod schemas accept well-formed payloads
 *  and reject malformed ones. Keeps the frontend honest against
 *  the ATF /dashboard/* contract.
 * ──────────────────────────────────────────────────────────── */

// ── Fixtures ─────────────────────────────────────────────────

const validHealth = {
  status: "healthy",
  uptime_seconds: 86400,
  version: "1.43.0",
  started_at: "2026-03-07T12:00:00Z",
  checks: [
    { name: "postgres", status: "pass", latency_ms: 2.3 },
    { name: "redis", status: "pass", latency_ms: 0.8, message: "connected" },
  ],
};

const validKpis = {
  total_requests_24h: 142_500,
  total_enforcements_24h: 3_200,
  active_tenants: 18,
  avg_latency_ms: 4.2,
  p99_latency_ms: 28.5,
  receipts_issued_24h: 9_800,
  uptime_pct: 99.98,
  error_rate_pct: 0.02,
};

const validEnforcement = {
  total_evaluated: 142_500,
  total_blocked: 1_200,
  total_allowed: 138_100,
  total_flagged: 3_200,
  block_rate_pct: 0.84,
  top_rules: [
    { rule: "rate-limit-exceeded", hits: 800, action: "block" as const },
    { rule: "suspicious-payload", hits: 400, action: "flag" as const },
  ],
};

const validActivity = {
  interval: "1h",
  points: [
    {
      timestamp: "2026-03-08T00:00:00Z",
      requests: 5_200,
      enforcements: 120,
      avg_latency_ms: 3.8,
    },
    {
      timestamp: "2026-03-08T01:00:00Z",
      requests: 4_800,
      enforcements: 95,
      avg_latency_ms: 4.1,
    },
  ],
};

const validTenants = {
  tenants: [
    {
      id: "tenant_abc123",
      name: "Acme Corp",
      status: "active" as const,
      requests_24h: 45_000,
      enforcements_24h: 900,
      avg_latency_ms: 3.5,
      last_seen: "2026-03-08T10:30:00Z",
    },
    {
      id: "tenant_xyz789",
      name: "Globex Inc",
      status: "inactive" as const,
      requests_24h: 0,
      enforcements_24h: 0,
      avg_latency_ms: 0,
      last_seen: null,
    },
  ],
  total: 2,
};

// ── Tests ────────────────────────────────────────────────────

describe("SystemHealthSchema", () => {
  it("accepts a valid health payload", () => {
    const result = SystemHealthSchema.safeParse(validHealth);
    expect(result.success).toBe(true);
  });

  it("rejects missing status", () => {
    const noStatus = Object.fromEntries(
      Object.entries(validHealth).filter(([k]) => k !== "status"),
    );
    const result = SystemHealthSchema.safeParse(noStatus);
    expect(result.success).toBe(false);
  });

  it("rejects invalid status value", () => {
    const result = SystemHealthSchema.safeParse({ ...validHealth, status: "unknown" });
    expect(result.success).toBe(false);
  });

  it("accepts empty checks array", () => {
    const result = SystemHealthSchema.safeParse({ ...validHealth, checks: [] });
    expect(result.success).toBe(true);
  });
});

describe("KpiSummarySchema", () => {
  it("accepts a valid KPI payload", () => {
    const result = KpiSummarySchema.safeParse(validKpis);
    expect(result.success).toBe(true);
  });

  it("rejects if a required field is missing", () => {
    const incomplete = Object.fromEntries(
      Object.entries(validKpis).filter(([k]) => k !== "uptime_pct"),
    );
    const result = KpiSummarySchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it("rejects string values for numeric fields", () => {
    const result = KpiSummarySchema.safeParse({ ...validKpis, avg_latency_ms: "fast" });
    expect(result.success).toBe(false);
  });
});

describe("EnforcementOverviewSchema", () => {
  it("accepts a valid enforcement payload", () => {
    const result = EnforcementOverviewSchema.safeParse(validEnforcement);
    expect(result.success).toBe(true);
  });

  it("rejects invalid action enum in top_rules", () => {
    const bad = {
      ...validEnforcement,
      top_rules: [{ rule: "test", hits: 1, action: "ignore" }],
    };
    const result = EnforcementOverviewSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("accepts empty top_rules", () => {
    const result = EnforcementOverviewSchema.safeParse({
      ...validEnforcement,
      top_rules: [],
    });
    expect(result.success).toBe(true);
  });
});

describe("ActivityTrendsSchema", () => {
  it("accepts a valid activity payload", () => {
    const result = ActivityTrendsSchema.safeParse(validActivity);
    expect(result.success).toBe(true);
  });

  it("accepts empty points array", () => {
    const result = ActivityTrendsSchema.safeParse({
      interval: "1h",
      points: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing interval", () => {
    const result = ActivityTrendsSchema.safeParse({ points: validActivity.points });
    expect(result.success).toBe(false);
  });
});

describe("TenantsResponseSchema", () => {
  it("accepts a valid tenants payload", () => {
    const result = TenantsResponseSchema.safeParse(validTenants);
    expect(result.success).toBe(true);
  });

  it("accepts null last_seen", () => {
    const result = TenantsResponseSchema.safeParse(validTenants);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tenants[1].last_seen).toBeNull();
    }
  });

  it("rejects invalid tenant status", () => {
    const bad = {
      ...validTenants,
      tenants: [{ ...validTenants.tenants[0], status: "banned" }],
    };
    const result = TenantsResponseSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("accepts empty tenants array", () => {
    const result = TenantsResponseSchema.safeParse({ tenants: [], total: 0 });
    expect(result.success).toBe(true);
  });
});

describe("DashboardSummarySchema", () => {
  it("accepts a live ATF summary with all fields", () => {
    const result = DashboardSummarySchema.safeParse({
      overall_status: "ok",
      build: "1.45.0",
      startup: "2026-03-08T00:00:00Z",
      backends: { postgres: "ok", redis: "ok" },
      enforcement: {
        auth_failures_total: 3,
        rate_limit_rejections_total: 12,
        quota_violations_total: 1,
        reprovision_operations_total: 0,
      },
      kpis: [
        { label: "Requests (24h)", value: 142500, unit: "", trend: "up" },
        { label: "Active Tenants", value: 18, unit: "", trend: "stable" },
        { label: "Avg Latency", value: "4.2ms", unit: "", trend: "down" },
        { label: "Uptime", value: "99.98%", unit: "", trend: "stable" },
      ],
      trend: {
        requests_last_hour: 5200,
        receipts_written_last_hour: 2400,
        enforcement_last_hour: 12,
        requests_today: 142500,
        receipts_written_today: 68000,
      },
      warnings: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a minimal summary with only trend data", () => {
    const result = DashboardSummarySchema.safeParse({
      trend: {
        requests_last_hour: 100,
        receipts_written_last_hour: 50,
        enforcement_last_hour: 2,
        requests_today: 2400,
        receipts_written_today: 1200,
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (all fields optional)", () => {
    const result = DashboardSummarySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("passes through unknown extra fields from ATF", () => {
    const result = DashboardSummarySchema.safeParse({
      some_future_field: "hello",
      another_one: 42,
    });
    expect(result.success).toBe(true);
  });

  it("accepts kpis as an array of items", () => {
    const result = DashboardSummarySchema.safeParse({
      kpis: [
        { label: "Requests", value: 100, unit: "req/s", trend: "up" },
        { label: "Latency", value: "3.2ms" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects kpis as an object (old schema shape)", () => {
    const result = DashboardSummarySchema.safeParse({
      kpis: { total_requests_24h: 100 },
    });
    expect(result.success).toBe(false);
  });
});

describe("LiveKpiItemSchema", () => {
  it("accepts a complete KPI item", () => {
    const result = LiveKpiItemSchema.safeParse({
      label: "Requests (24h)",
      value: 142500,
      unit: "",
      trend: "up",
    });
    expect(result.success).toBe(true);
  });

  it("accepts string values", () => {
    const result = LiveKpiItemSchema.safeParse({
      label: "Latency",
      value: "4.2ms",
    });
    expect(result.success).toBe(true);
  });

  it("allows omitted unit and trend", () => {
    const result = LiveKpiItemSchema.safeParse({
      label: "Uptime",
      value: 99.98,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.unit).toBeUndefined();
      expect(result.data.trend).toBeUndefined();
    }
  });

  it("rejects missing label", () => {
    const result = LiveKpiItemSchema.safeParse({ value: 100 });
    expect(result.success).toBe(false);
  });
});

describe("LiveEnforcementSchema", () => {
  it("accepts a complete enforcement payload", () => {
    const result = LiveEnforcementSchema.safeParse({
      auth_failures_total: 3,
      rate_limit_rejections_total: 12,
      quota_violations_total: 1,
      reprovision_operations_total: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = LiveEnforcementSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("passes through extra fields", () => {
    const result = LiveEnforcementSchema.safeParse({
      auth_failures_total: 1,
      rate_limit_rejections_total: 0,
      quota_violations_total: 0,
      reprovision_operations_total: 0,
      some_future_counter: 42,
    });
    expect(result.success).toBe(true);
  });
});

describe("LiveTrendSchema", () => {
  it("accepts a complete trend payload", () => {
    const result = LiveTrendSchema.safeParse({
      requests_last_hour: 5200,
      receipts_written_last_hour: 2400,
      enforcement_last_hour: 12,
      requests_today: 142500,
      receipts_written_today: 68000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing fields", () => {
    const result = LiveTrendSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("passes through extra fields", () => {
    const result = LiveTrendSchema.safeParse({
      requests_last_hour: 100,
      receipts_written_last_hour: 50,
      enforcement_last_hour: 2,
      requests_today: 2400,
      receipts_written_today: 1200,
      some_future_field: "hello",
    });
    expect(result.success).toBe(true);
  });
});

// ── MonetizationSettingsSchema ───────────────────────────────

describe("MonetizationSettingsSchema", () => {
  const validSettings = {
    monetization_enabled: false,
    pricing_page_enabled: true,
    upgrade_cta_enabled: true,
    quota_enforcement_mode: "off",
    paid_feature_gates_enabled: false,
    real_execution_paid_gate_enabled: false,
    pro_self_serve_enabled: false,
    enterprise_contact_only: true,
  };

  it("accepts a complete settings payload", () => {
    const result = MonetizationSettingsSchema.safeParse(validSettings);
    expect(result.success).toBe(true);
  });

  it("accepts all quota enforcement modes", () => {
    for (const mode of ["off", "soft", "hard"]) {
      const result = MonetizationSettingsSchema.safeParse({
        ...validSettings,
        quota_enforcement_mode: mode,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid quota enforcement mode", () => {
    const result = MonetizationSettingsSchema.safeParse({
      ...validSettings,
      quota_enforcement_mode: "unknown",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = MonetizationSettingsSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean toggle values", () => {
    const result = MonetizationSettingsSchema.safeParse({
      ...validSettings,
      monetization_enabled: "yes",
    });
    expect(result.success).toBe(false);
  });
});
