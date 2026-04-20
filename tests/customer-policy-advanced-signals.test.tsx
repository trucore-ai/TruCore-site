import "./customer-policy-test-mocks";
import { describe, expect, it, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import CustomerPoliciesPage from "@/app/customer/policies/page";
import {
  ENTERPRISE_POLICY,
  MARKET_DEGRADED,
  MARKET_STABLE,
  mockFetchExternalContext,
  mockFetchMarketConditions,
  mockFetchPolicy,
  PRO_POLICY,
  resetCustomerPolicyPageMocks,
} from "./customer-policy-page-testkit";

describe("CustomerPoliciesPage — signal freshness and refresh UX", () => {
  beforeEach(() => {
    resetCustomerPolicyPageMocks();
  });

  it("shows Live, stale, unavailable, and external freshness badges as appropriate", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("freshness-badge-market-analysis").textContent).toContain("Live");
    });

    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchMarketConditions.mockResolvedValue({
      ...MARKET_DEGRADED,
      signal_freshness: { status: "stale" as const, last_updated_at: Date.now() / 1000 - 600 },
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getAllByTestId("freshness-badge-market-analysis")[1].textContent).toContain("Data may be outdated");
    });

    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchMarketConditions.mockResolvedValue({
      ...MARKET_STABLE,
      signal_freshness: { status: "unavailable" as const, last_updated_at: null },
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getAllByTestId("freshness-badge-market-analysis")[2].textContent).toContain("Signal unavailable");
    });

    mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
    mockFetchExternalContext.mockResolvedValue({
      recommendations: [{
        id: "EXT_SUSTAINED_THROTTLE",
        title: "Sustained external network pressure detected",
        explanation: "Throttling detected.",
        parameter: "require_simulation_success",
        confidence: "high",
        evidence: "6 consecutive minutes.",
      }],
      captured_at: Date.now() / 1000,
      plan: "enterprise",
      signal_freshness: { status: "fresh" as const, last_updated_at: Date.now() / 1000 },
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("freshness-badge-external-context").textContent).toContain("Live");
    });
  });

  it("does not render freshness badge when signal metadata is absent", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchMarketConditions.mockResolvedValue({ ...MARKET_DEGRADED, signal_freshness: undefined });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    expect(screen.queryByTestId("freshness-badge-market-analysis")).toBeNull();
  });

  it("shows recheck button only when a signal is stale or unavailable", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchMarketConditions.mockResolvedValue({
      ...MARKET_DEGRADED,
      signal_freshness: { status: "stale" as const, last_updated_at: Date.now() / 1000 - 600 },
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("refresh-signals-btn").textContent).toContain("Recheck signals");
    });

    mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_STABLE);
    mockFetchExternalContext.mockResolvedValue({
      recommendations: [],
      captured_at: Date.now() / 1000,
      plan: "enterprise",
      signal_freshness: { status: "unavailable" as const, last_updated_at: null },
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getAllByTestId("refresh-signals-btn")[1].textContent).toContain("Recheck signals");
    });
  });

  it("does not show recheck button when all signals are fresh", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchMarketConditions.mockResolvedValue({
      ...MARKET_DEGRADED,
      signal_freshness: { status: "fresh" as const, last_updated_at: Date.now() / 1000 },
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    expect(screen.queryByTestId("refresh-signals-btn")).toBeNull();
  });

  it("refresh action re-fetches signals, updates freshness UI, and enters cooldown", async () => {
    const staleMarket = {
      ...MARKET_DEGRADED,
      signal_freshness: { status: "stale" as const, last_updated_at: Date.now() / 1000 - 600 },
    };
    const freshMarket = {
      ...MARKET_DEGRADED,
      signal_freshness: { status: "fresh" as const, last_updated_at: Date.now() / 1000 },
    };

    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchMarketConditions.mockResolvedValue(staleMarket);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("freshness-badge-market-analysis").textContent).toContain("Data may be outdated");
    });

    const marketCallsBefore = mockFetchMarketConditions.mock.calls.length;
    const externalCallsBefore = mockFetchExternalContext.mock.calls.length;
    mockFetchMarketConditions.mockResolvedValue(freshMarket);
    mockFetchExternalContext.mockResolvedValue({
      recommendations: [],
      captured_at: Date.now() / 1000,
      plan: "pro",
      signal_freshness: { status: "fresh" as const, last_updated_at: Date.now() / 1000 },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("refresh-signals-btn"));
    });

    expect(mockFetchMarketConditions.mock.calls.length).toBeGreaterThan(marketCallsBefore);
    expect(mockFetchExternalContext.mock.calls.length).toBeGreaterThan(externalCallsBefore);

    await waitFor(() => {
      expect(screen.getByTestId("freshness-badge-market-analysis").textContent).toContain("Live");
    });

    expect(screen.getByTestId("signal-last-updated").textContent).toMatch(/Updated \d+m ago|Updated just now/);
    await waitFor(() => {
      const btn = screen.queryByTestId("refresh-signals-btn");
      if (btn) expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
    expect(screen.getByTestId("signal-freshness-row")).toBeTruthy();
  });
});
