import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusChip } from "@/components/dashboard/status-chip";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ErrorPanel } from "@/components/dashboard/error-panel";
import { HeroKpis } from "@/components/dashboard/hero-kpis";
import { HealthStrip } from "@/components/dashboard/health-strip";
import { TenantTable } from "@/components/dashboard/tenant-table";
import type { KpiSummary, SystemHealth, TenantSummary } from "@/lib/dashboard-client";

/* ────────────────────────────────────────────────────────────────
 *  Dashboard component render tests
 *
 *  Validates that each dashboard component renders correctly
 *  with valid data and handles edge cases gracefully.
 * ──────────────────────────────────────────────────────────── */

// ── Fixtures ─────────────────────────────────────────────────

const kpiFixture: KpiSummary = {
  total_requests_24h: 142_500,
  total_enforcements_24h: 3_200,
  active_tenants: 18,
  avg_latency_ms: 4.2,
  p99_latency_ms: 28.5,
  receipts_issued_24h: 9_800,
  uptime_pct: 99.98,
  error_rate_pct: 0.02,
};

const healthFixture: SystemHealth = {
  status: "healthy",
  uptime_seconds: 172_800,
  version: "1.43.0",
  started_at: "2026-03-06T12:00:00Z",
  checks: [
    { name: "postgres", status: "pass", latency_ms: 2.3 },
    { name: "redis", status: "warn", latency_ms: 15.1, message: "slow" },
  ],
};

const tenantFixtures: TenantSummary[] = [
  {
    id: "t_abc",
    name: "Acme Corp",
    status: "active",
    requests_24h: 45_000,
    enforcements_24h: 900,
    avg_latency_ms: 3.5,
    last_seen: "2026-03-08T10:30:00Z",
  },
];

// ── StatusChip ───────────────────────────────────────────────

describe("StatusChip", () => {
  it("renders the status label", () => {
    render(<StatusChip status="healthy" />);
    expect(screen.getByText("healthy")).toBeInTheDocument();
  });

  it("renders a custom label when provided", () => {
    render(<StatusChip status="pass" label="Connected" />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("applies pulse animation class when pulse is true", () => {
    const { container } = render(<StatusChip status="healthy" pulse />);
    const pulseEl = container.querySelector(".animate-ping");
    expect(pulseEl).toBeTruthy();
  });
});

// ── EmptyState ───────────────────────────────────────────────

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        title="No data"
        description="Nothing to show right now."
      />,
    );
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.getByText("Nothing to show right now.")).toBeInTheDocument();
  });
});

// ── ErrorPanel ───────────────────────────────────────────────

describe("ErrorPanel", () => {
  it("renders the error message with alert role", () => {
    render(<ErrorPanel message="Connection refused" />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("Connection refused")).toBeInTheDocument();
  });

  it("renders a custom title", () => {
    render(<ErrorPanel title="Endpoint down" message="503" />);
    expect(screen.getByText("Endpoint down")).toBeInTheDocument();
  });
});

// ── HeroKpis ─────────────────────────────────────────────────

describe("HeroKpis", () => {
  it("renders all four KPI cards", () => {
    render(<HeroKpis data={kpiFixture} />);
    expect(screen.getByText("Requests (24h)")).toBeInTheDocument();
    expect(screen.getByText("Active Tenants")).toBeInTheDocument();
    expect(screen.getByText("Avg Latency")).toBeInTheDocument();
    expect(screen.getByText("Uptime")).toBeInTheDocument();
  });

  it("formats large numbers compactly", () => {
    render(<HeroKpis data={kpiFixture} />);
    expect(screen.getByText("142.5K")).toBeInTheDocument();
  });

  it("shows uptime percentage", () => {
    render(<HeroKpis data={kpiFixture} />);
    expect(screen.getByText("99.98%")).toBeInTheDocument();
  });
});

// ── HealthStrip ──────────────────────────────────────────────

describe("HealthStrip", () => {
  it("renders system health heading", () => {
    render(<HealthStrip data={healthFixture} />);
    expect(screen.getByText("System Health")).toBeInTheDocument();
  });

  it("shows version and uptime", () => {
    render(<HealthStrip data={healthFixture} />);
    expect(screen.getByText("1.43.0")).toBeInTheDocument();
    expect(screen.getByText("2d 0h")).toBeInTheDocument();
  });

  it("renders all dependency checks", () => {
    render(<HealthStrip data={healthFixture} />);
    expect(screen.getByText("postgres")).toBeInTheDocument();
    expect(screen.getByText("redis")).toBeInTheDocument();
  });

  it("shows empty state when checks array is empty", () => {
    render(<HealthStrip data={{ ...healthFixture, checks: [] }} />);
    expect(screen.getByText("No health checks reported")).toBeInTheDocument();
  });
});

// ── TenantTable ──────────────────────────────────────────────

describe("TenantTable", () => {
  it("renders tenant name and ID", () => {
    render(<TenantTable tenants={tenantFixtures} total={1} />);
    const names = screen.getAllByText("Acme Corp");
    expect(names.length).toBeGreaterThanOrEqual(1);
    const ids = screen.getAllByText("t_abc");
    expect(ids.length).toBeGreaterThanOrEqual(1);
  });

  it("shows total count", () => {
    render(<TenantTable tenants={tenantFixtures} total={1} />);
    expect(screen.getByText("1 total")).toBeInTheDocument();
  });

  it("renders empty state for zero tenants", () => {
    render(<TenantTable tenants={[]} total={0} />);
    expect(screen.getByText("No tenants found")).toBeInTheDocument();
  });
});
