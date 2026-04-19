import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  CustomerPoliciesPage,
  PRO_POLICY,
  MARKET_DEGRADED,
  mockFetchMarketConditions,
  mockFetchPolicy,
  resetPolicyMocks,
} from "./customer-policy-test-harness";

describe.skip("CustomerPoliciesPage — advanced signal freshness and details", () => {
  beforeEach(() => {
    resetPolicyMocks();
  });

  it("shows stale freshness state and refresh button", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchMarketConditions.mockResolvedValue({
      ...MARKET_DEGRADED,
      signal_freshness: { status: "stale" as const, last_updated_at: Date.now() / 1000 - 600 },
    });

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("freshness-badge-market-analysis").textContent).toContain("Data may be outdated");
    });

    expect(screen.getByTestId("refresh-signals-btn")).toBeTruthy();
  });

  it("refresh action re-fetches and updates freshness label", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchMarketConditions.mockResolvedValue({
      ...MARKET_DEGRADED,
      signal_freshness: { status: "stale" as const, last_updated_at: Date.now() / 1000 - 600 },
    });

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("refresh-signals-btn")).toBeTruthy();
    });

    mockFetchMarketConditions.mockResolvedValue({
      ...MARKET_DEGRADED,
      signal_freshness: { status: "fresh" as const, last_updated_at: Date.now() / 1000 },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("refresh-signals-btn"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("freshness-badge-market-analysis").textContent).toContain("Live");
    });
  });

  it("recommendation details toggle expands and collapses", async () => {
    mockFetchPolicy.mockResolvedValue({
      ...PRO_POLICY,
      effective: { ...PRO_POLICY.effective, require_simulation_success: false },
    });

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-enable-simulation")).toBeTruthy();
    });

    const toggle = screen.getByTestId("recommendation-details-toggle-enable-simulation");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByTestId("recommendation-details-enable-simulation")).toBeTruthy();

    fireEvent.click(toggle);
    expect(screen.queryByTestId("recommendation-details-enable-simulation")).toBeNull();
  });
});
