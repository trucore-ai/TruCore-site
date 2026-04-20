import "./customer-policy-test-mocks";
import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CustomerPoliciesPage from "@/app/customer/policies/page";
import {
  HISTORY_SUMMARY,
  MARKET_DEGRADED,
  MARKET_STABLE,
  MARKET_STRESSED,
  mockFetchMarketConditions,
  mockFetchPolicy,
  mockFetchReceiptSummary,
  PRO_POLICY,
  resetCustomerPolicyPageMocks,
} from "./customer-policy-page-testkit";

describe("CustomerPoliciesPage — market recommendations", () => {
  beforeEach(() => {
    resetCustomerPolicyPageMocks();
  });

  it("renders market recs for degraded/stressed conditions with source labels and evidence", async () => {
    mockFetchPolicy.mockResolvedValue({ ...PRO_POLICY, effective: { ...PRO_POLICY.effective, require_simulation_success: false } });
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-market-enable-simulation")).toBeTruthy();
    });

    const rec = screen.getByTestId("recommendation-market-enable-simulation");
    expect(Array.from(rec.querySelectorAll("[data-testid='recommendation-source']")).map((s) => s.textContent)).toContain("Market analysis");
    fireEvent.click(screen.getByTestId("recommendation-details-toggle-market-enable-simulation"));
    expect(screen.getByText(/minor degradation/)).toBeTruthy();
    expect(screen.getByText(/current execution conditions/)).toBeTruthy();

    mockFetchPolicy.mockResolvedValue({ ...PRO_POLICY, effective: { ...PRO_POLICY.effective, max_slippage_bps: 300, max_notional_usd: 100000, require_simulation_success: false } });
    mockFetchMarketConditions.mockResolvedValue(MARKET_STRESSED);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-market-tighten-slippage")).toBeTruthy();
      expect(screen.getByTestId("recommendation-market-review-limits")).toBeTruthy();
      expect(screen.getByTestId("recommendation-market-tx-submission-throttled")).toBeTruthy();
    });
  });

  it("market recs coexist with deterministic and history recommendations", async () => {
    mockFetchPolicy.mockResolvedValue({ ...PRO_POLICY, effective: { ...PRO_POLICY.effective, require_simulation_success: false } });
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-enable-simulation")).toBeTruthy();
      expect(screen.getByTestId("recommendation-market-enable-simulation")).toBeTruthy();
      expect(screen.getByTestId("recommendation-history-simulation-failures")).toBeTruthy();
    });
  });

  it("gracefully degrades when signals are stable, already satisfied, tight, or unavailable", async () => {
    mockFetchPolicy.mockResolvedValue({ ...PRO_POLICY, effective: { ...PRO_POLICY.effective, require_simulation_success: false } });
    mockFetchMarketConditions.mockResolvedValue(MARKET_STABLE);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-enable-simulation")).toBeTruthy();
    });
    expect(screen.queryByTestId("recommendation-market-enable-simulation")).toBeNull();

    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_STRESSED);
    render(<CustomerPoliciesPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId("policy-recommendations")[1]).toBeTruthy();
    });
    expect(screen.queryByTestId("recommendation-market-enable-simulation")).toBeNull();
    expect(screen.queryByTestId("recommendation-market-tx-submission-throttled")).toBeNull();
    expect(screen.queryByTestId("recommendation-market-tighten-slippage")).toBeNull();

    mockFetchPolicy.mockResolvedValue({ ...PRO_POLICY, effective: { ...PRO_POLICY.effective, require_simulation_success: false } });
    mockFetchMarketConditions.mockRejectedValue(new Error("network error"));
    render(<CustomerPoliciesPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId("recommendation-enable-simulation")[1]).toBeTruthy();
    });
    expect(screen.queryByTestId("recommendation-market-enable-simulation")).toBeNull();
  });
});
