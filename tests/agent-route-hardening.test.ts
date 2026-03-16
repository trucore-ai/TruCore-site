import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/* ═══════════ Mocks ═══════════ */

const mocks = vi.hoisted(() => ({
  fetchFullDashboardMock: vi.fn(),
  fetchTenantDetailMock: vi.fn(),
  serializeDashboardSnapshotMock: vi.fn(() => ({
    schema_version: "1.1.0",
    available: true,
  })),
  serializeTenantSnapshotMock: vi.fn(() => ({
    schema_version: "1.1.0",
    available: true,
    tenant_id: "t1",
  })),
}));

vi.mock("@/lib/dashboard-client", () => ({
  fetchFullDashboard: mocks.fetchFullDashboardMock,
  fetchTenantDetail: mocks.fetchTenantDetailMock,
}));

vi.mock("@/lib/agent-serializer", () => ({
  serializeDashboardSnapshot: mocks.serializeDashboardSnapshotMock,
  serializeTenantSnapshot: mocks.serializeTenantSnapshotMock,
  AGENT_SCHEMA_VERSION: "1.1.0",
  POLLING_INTERVAL_SECONDS: 5,
}));

import {
  getSecurityEventCounters,
  _resetSecurityEventCounters,
} from "@/lib/security-log";
import { _resetRateLimitBuckets } from "@/lib/rate-limit";

/* Lazy-import routes after mocks are wired */
const dashboardRoute = () => import("@/app/api/agent/dashboard/route");
const tenantRoute = () => import("@/app/api/agent/tenant/route");
const streamRoute = () => import("@/app/api/agent/stream/route");

/* ═══════════ Helpers ═══════════ */

function makeRequest(path: string, ip = "10.0.0.1"): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    headers: { "x-forwarded-for": ip },
  });
}

afterEach(() => {
  _resetSecurityEventCounters();
  _resetRateLimitBuckets();
  vi.restoreAllMocks();
  mocks.fetchFullDashboardMock.mockReset();
  mocks.fetchTenantDetailMock.mockReset();
  mocks.serializeDashboardSnapshotMock.mockClear();
  mocks.serializeTenantSnapshotMock.mockClear();
});

/* ═══════════════════════════════════════════════════════════
 *  /api/agent/dashboard
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/agent/dashboard", () => {
  it("returns 200 with snapshot on success", async () => {
    mocks.fetchFullDashboardMock.mockResolvedValue({});
    const { GET } = await dashboardRoute();
    const res = await GET(makeRequest("/api/agent/dashboard"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(true);
    expect(body.schema_version).toBe("1.1.0");
  });

  it("returns 502 with safe error on backend failure", async () => {
    mocks.fetchFullDashboardMock.mockRejectedValue(new Error("db down"));
    const { GET } = await dashboardRoute();
    const res = await GET(makeRequest("/api/agent/dashboard"));

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.available).toBe(false);
    expect(body.reason).toBe("temporarily_unavailable");
  });

  it("does not leak backend error details on failure", async () => {
    mocks.fetchFullDashboardMock.mockRejectedValue(
      new Error("FATAL: password authentication failed for user postgres"),
    );
    const { GET } = await dashboardRoute();
    const res = await GET(makeRequest("/api/agent/dashboard"));
    const text = await res.text();

    expect(text).not.toContain("FATAL");
    expect(text).not.toContain("password");
    expect(text).not.toContain("postgres");
    expect(text).not.toContain("authentication");
  });

  it("rate-limits excessive requests and returns 429", async () => {
    mocks.fetchFullDashboardMock.mockResolvedValue({});
    const { GET } = await dashboardRoute();

    // Send 60 allowed requests
    for (let i = 0; i < 60; i++) {
      const res = await GET(makeRequest("/api/agent/dashboard"));
      expect(res.status).toBe(200);
    }

    // 61st request should be rate-limited
    const res = await GET(makeRequest("/api/agent/dashboard"));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("rate-limit 429 response does not leak internal details", async () => {
    mocks.fetchFullDashboardMock.mockResolvedValue({});
    const { GET } = await dashboardRoute();

    for (let i = 0; i < 61; i++) {
      await GET(makeRequest("/api/agent/dashboard"));
    }

    const res = await GET(makeRequest("/api/agent/dashboard"));
    const text = await res.text();

    expect(text).toBe("");
    expect(text).not.toContain("10.0.0.1");
    expect(text).not.toContain("token");
    expect(text).not.toContain("cookie");
  });

  it("logs agent_route_rate_limited event on throttle", async () => {
    mocks.fetchFullDashboardMock.mockResolvedValue({});
    const { GET } = await dashboardRoute();

    for (let i = 0; i < 61; i++) {
      await GET(makeRequest("/api/agent/dashboard"));
    }

    const counters = getSecurityEventCounters();
    expect(counters.agent_route_rate_limited).toBe(1);
  });

  it("does not rate-limit different IPs independently", async () => {
    mocks.fetchFullDashboardMock.mockResolvedValue({});
    const { GET } = await dashboardRoute();

    // Exhaust limit for IP A
    for (let i = 0; i < 61; i++) {
      await GET(makeRequest("/api/agent/dashboard", "10.0.0.1"));
    }

    // IP B should still work
    const res = await GET(makeRequest("/api/agent/dashboard", "10.0.0.2"));
    expect(res.status).toBe(200);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  /api/agent/tenant
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/agent/tenant", () => {
  it("returns 200 with snapshot for valid tenant", async () => {
    mocks.fetchTenantDetailMock.mockResolvedValue({
      ok: true,
      data: { id: "t1" },
    });
    const { GET } = await tenantRoute();
    const res = await GET(makeRequest("/api/agent/tenant?id=t1"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.available).toBe(true);
  });

  it("returns 400 with safe message when id param is missing", async () => {
    const { GET } = await tenantRoute();
    const res = await GET(makeRequest("/api/agent/tenant"));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.reason).toBe("missing_required_parameter");
    expect(body.available).toBe(false);
  });

  it("does not reflect user-supplied tenant ID in error response", async () => {
    mocks.fetchTenantDetailMock.mockResolvedValue({
      ok: false,
      error: "404 not found",
    });
    const { GET } = await tenantRoute();
    const maliciousId = "<script>alert(1)</script>";
    const res = await GET(
      makeRequest(`/api/agent/tenant?id=${encodeURIComponent(maliciousId)}`),
    );
    const text = await res.text();

    expect(text).not.toContain("<script>");
    expect(text).not.toContain("alert");
    expect(text).not.toContain(maliciousId);
  });

  it("returns 404 with safe reason for unknown tenant", async () => {
    mocks.fetchTenantDetailMock.mockResolvedValue({
      ok: false,
      error: "404 not found",
    });
    const { GET } = await tenantRoute();
    const res = await GET(makeRequest("/api/agent/tenant?id=unknown-id"));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.reason).toBe("tenant_not_found");
    expect(body.available).toBe(false);
    // Must not contain the user-supplied tenant ID
    expect(JSON.stringify(body)).not.toContain("unknown-id");
  });

  it("returns 502 with safe error on upstream failure", async () => {
    mocks.fetchTenantDetailMock.mockResolvedValue({
      ok: false,
      error: "Connection refused to postgres:5432",
    });
    const { GET } = await tenantRoute();
    const res = await GET(makeRequest("/api/agent/tenant?id=t1"));

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.reason).toBe("upstream_unavailable");
    expect(JSON.stringify(body)).not.toContain("postgres");
    expect(JSON.stringify(body)).not.toContain("5432");
  });

  it("returns 502 with safe error on exception", async () => {
    mocks.fetchTenantDetailMock.mockRejectedValue(
      new Error("ECONNREFUSED 127.0.0.1:5432"),
    );
    const { GET } = await tenantRoute();
    const res = await GET(makeRequest("/api/agent/tenant?id=t1"));

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.reason).toBe("temporarily_unavailable");
    expect(JSON.stringify(body)).not.toContain("ECONNREFUSED");
  });

  it("rate-limits excessive requests and returns 429", async () => {
    mocks.fetchTenantDetailMock.mockResolvedValue({
      ok: true,
      data: { id: "t1" },
    });
    const { GET } = await tenantRoute();

    for (let i = 0; i < 60; i++) {
      const res = await GET(makeRequest("/api/agent/tenant?id=t1"));
      expect(res.status).toBe(200);
    }

    const res = await GET(makeRequest("/api/agent/tenant?id=t1"));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("logs agent_route_rate_limited event on throttle", async () => {
    mocks.fetchTenantDetailMock.mockResolvedValue({
      ok: true,
      data: { id: "t1" },
    });
    const { GET } = await tenantRoute();

    for (let i = 0; i < 61; i++) {
      await GET(makeRequest("/api/agent/tenant?id=t1"));
    }

    const counters = getSecurityEventCounters();
    expect(counters.agent_route_rate_limited).toBe(1);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  /api/agent/stream — connection-rate limiting
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/agent/stream", () => {
  it("returns SSE stream on allowed request", async () => {
    mocks.fetchFullDashboardMock.mockResolvedValue({});
    const { GET } = await streamRoute();
    const res = await GET(makeRequest("/api/agent/stream"));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");
  });

  it("rate-limits excessive connection attempts", async () => {
    mocks.fetchFullDashboardMock.mockResolvedValue({});
    const { GET } = await streamRoute();

    // Use 10 allowed connections
    for (let i = 0; i < 10; i++) {
      const res = await GET(makeRequest("/api/agent/stream"));
      expect(res.status).toBe(200);
    }

    // 11th should be rate-limited
    const res = await GET(makeRequest("/api/agent/stream"));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });

  it("logs agent_route_rate_limited event for stream throttle", async () => {
    mocks.fetchFullDashboardMock.mockResolvedValue({});
    const { GET } = await streamRoute();

    for (let i = 0; i < 11; i++) {
      await GET(makeRequest("/api/agent/stream"));
    }

    const counters = getSecurityEventCounters();
    expect(counters.agent_route_rate_limited).toBe(1);
  });

  it("429 response contains no internal details", async () => {
    mocks.fetchFullDashboardMock.mockResolvedValue({});
    const { GET } = await streamRoute();

    for (let i = 0; i < 11; i++) {
      await GET(makeRequest("/api/agent/stream"));
    }

    const res = await GET(makeRequest("/api/agent/stream"));
    const text = await res.text();

    expect(text).toBe("");
    expect(text).not.toContain("10.0.0.1");
  });
});
