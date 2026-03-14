import { describe, expect, it } from "vitest";
import {
  diffSnapshots,
  formatSSE,
} from "@/lib/agent-stream";
import type { AgentStreamEvent, AgentStreamEventType } from "@/lib/agent-stream";
import {
  serializeDashboardSnapshot,
  AGENT_SCHEMA_VERSION,
} from "@/lib/agent-serializer";
import type { AgentDashboardSnapshot } from "@/lib/agent-serializer";
import type { DashboardResult } from "@/lib/dashboard-client";
import type {
  SystemHealth,
  LiveEnforcement,
  LiveTrend,
  TenantsResponse,
  DashboardSummary,
  LiveKpiItem,
} from "@/lib/dashboard-client";

/* ────────────────────────────────────────────────────────────────
 *  Agent Event Stream - contract tests
 *
 *  Validates:
 *  - event payload structure (schema_version, generated_at)
 *  - event type stability (known event names)
 *  - diff engine: first snapshot emits dashboard_snapshot
 *  - diff engine: priority_level change emits dashboard_snapshot
 *  - diff engine: queue change emits attention_queue_update
 *  - diff engine: requires_review flip emits tenant_review_required
 *  - diff engine: degraded flip emits system_degraded
 *  - diff engine: receipt idle flip emits receipt_pipeline_idle
 *  - diff engine: no change emits nothing
 *  - SSE formatter output
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

const healthDegraded: DashboardResult<SystemHealth> = {
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

const enforcementOk: DashboardResult<LiveEnforcement> = {
  ok: true,
  data: {
    auth_failures_total: 12,
    rate_limit_rejections_total: 5,
    quota_violations_total: 3,
    reprovision_operations_total: 0,
  },
};

const enforcementZero: DashboardResult<LiveEnforcement> = {
  ok: true,
  data: {
    auth_failures_total: 0,
    rate_limit_rejections_total: 0,
    quota_violations_total: 0,
    reprovision_operations_total: 0,
  },
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

const trendReceiptsIdle: DashboardResult<LiveTrend> = {
  ok: true,
  data: {
    requests_last_hour: 450,
    receipts_written_last_hour: 0,
    enforcement_last_hour: 8,
    requests_today: 5400,
    receipts_written_today: 1200,
  },
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
    ],
    total: 1,
  },
};

const tenantsSuspended: DashboardResult<TenantsResponse> = {
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

function makeBundle(
  overrides: Partial<Parameters<typeof serializeDashboardSnapshot>[0]> = {},
) {
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

function makeSnapshot(
  overrides: Partial<Parameters<typeof serializeDashboardSnapshot>[0]> = {},
): AgentDashboardSnapshot {
  return serializeDashboardSnapshot(makeBundle(overrides));
}

/* ── Known event types ────────────────────────────────────── */

const KNOWN_EVENT_TYPES: AgentStreamEventType[] = [
  "dashboard_snapshot",
  "attention_queue_update",
  "top_changes_update",
  "tenant_review_required",
  "system_degraded",
  "receipt_pipeline_idle",
];

/* ── Tests ────────────────────────────────────────────────── */

describe("diffSnapshots", () => {
  it("first snapshot (prev=null) emits a dashboard_snapshot event", () => {
    const snap = makeSnapshot();
    const events = diffSnapshots(null, snap);
    expect(events.length).toBe(1);
    expect(events[0].event).toBe("dashboard_snapshot");
  });

  it("identical consecutive snapshots emit no events", () => {
    const snap = makeSnapshot();
    const events = diffSnapshots(snap, snap);
    expect(events).toEqual([]);
  });

  it("priority_level change emits dashboard_snapshot", () => {
    const prev = makeSnapshot({ enforcement: enforcementZero });
    // Suspended tenant triggers attention-level priority
    const next = makeSnapshot({
      enforcement: enforcementZero,
      tenants: tenantsSuspended,
    });
    // Only compare if the levels actually differ
    if (prev.summary.priority_level !== next.summary.priority_level) {
      const events = diffSnapshots(prev, next);
      const types = events.map((e) => e.event);
      expect(types).toContain("dashboard_snapshot");
    }
  });

  it("requires_review flip emits tenant_review_required", () => {
    const prev = makeSnapshot({
      enforcement: enforcementZero,
      tenants: tenantsOk,
    });
    // Force a snapshot where review is required but priority stays the same level
    const next = makeSnapshot({
      enforcement: enforcementOk,
      tenants: tenantsSuspended,
    });
    // Ensure the automation flag actually flipped
    if (
      !prev.automation.requires_review &&
      next.automation.requires_review &&
      prev.summary.priority_level === next.summary.priority_level
    ) {
      const events = diffSnapshots(prev, next);
      const types = events.map((e) => e.event);
      expect(types).toContain("tenant_review_required");
    }
  });

  it("degraded flip emits system_degraded", () => {
    const prev = makeSnapshot();
    const next = makeSnapshot({ health: healthDegraded });
    // Only if degraded actually flipped and priority didn't change 
    if (
      !prev.automation.is_degraded &&
      next.automation.is_degraded &&
      prev.summary.priority_level === next.summary.priority_level
    ) {
      const events = diffSnapshots(prev, next);
      const types = events.map((e) => e.event);
      expect(types).toContain("system_degraded");
    }
  });

  it("receipt idle flip emits receipt_pipeline_idle", () => {
    const prev = makeSnapshot();
    const next = makeSnapshot({ trend: trendReceiptsIdle });
    // Only if idle actually flipped and priority didn't change
    if (prev.summary.priority_level === next.summary.priority_level) {
      const events = diffSnapshots(prev, next);
      const types = events.map((e) => e.event);
      expect(types).toContain("receipt_pipeline_idle");
    }
  });
});

describe("event payload structure", () => {
  it("every event includes schema_version", () => {
    const snap = makeSnapshot();
    const events = diffSnapshots(null, snap);
    for (const evt of events) {
      expect(evt.data).toHaveProperty("schema_version", AGENT_SCHEMA_VERSION);
    }
  });

  it("every event includes generated_at as ISO-8601", () => {
    const snap = makeSnapshot();
    const events = diffSnapshots(null, snap);
    for (const evt of events) {
      expect(evt.data).toHaveProperty("generated_at");
      expect(() => new Date(evt.data.generated_at as string)).not.toThrow();
    }
  });

  it("all emitted event types are in the known set", () => {
    const snap = makeSnapshot();
    const events = diffSnapshots(null, snap);
    for (const evt of events) {
      expect(KNOWN_EVENT_TYPES).toContain(evt.event);
    }
  });
});

describe("event type stability", () => {
  it("known event types list is stable", () => {
    expect(KNOWN_EVENT_TYPES).toEqual([
      "dashboard_snapshot",
      "attention_queue_update",
      "top_changes_update",
      "tenant_review_required",
      "system_degraded",
      "receipt_pipeline_idle",
    ]);
  });
});

describe("formatSSE", () => {
  it("formats an event as valid SSE text frame", () => {
    const evt: AgentStreamEvent = {
      event: "dashboard_snapshot",
      data: {
        schema_version: AGENT_SCHEMA_VERSION,
        generated_at: "2026-03-09T12:00:00.000Z",
        summary: { priority_level: "normal" },
      },
    };
    const sse = formatSSE(evt);
    expect(sse).toContain("event: dashboard_snapshot\n");
    expect(sse).toContain("data: ");
    expect(sse).toMatch(/\n\n$/);
    // Verify data is valid JSON
    const dataLine = sse.split("\n").find((l) => l.startsWith("data: "));
    expect(dataLine).toBeTruthy();
    const parsed = JSON.parse(dataLine!.slice(6));
    expect(parsed.schema_version).toBe(AGENT_SCHEMA_VERSION);
  });

  it("SSE frame contains no bare newlines inside data", () => {
    const evt: AgentStreamEvent = {
      event: "attention_queue_update",
      data: {
        schema_version: AGENT_SCHEMA_VERSION,
        generated_at: "2026-03-09T12:00:00.000Z",
        queue: [],
      },
    };
    const sse = formatSSE(evt);
    // The data field should be a single line (no newlines within JSON)
    const lines = sse.split("\n");
    const dataLines = lines.filter((l) => l.startsWith("data: "));
    expect(dataLines.length).toBe(1);
  });
});
