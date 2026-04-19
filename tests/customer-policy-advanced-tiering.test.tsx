import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  CustomerPoliciesPage,
  FREE_POLICY,
  PRO_POLICY,
  HISTORY_SUMMARY,
  MARKET_DEGRADED,
  MARKET_STABLE,
  mockFetchReceiptSummary,
  mockFetchMarketConditions,
  mockFetchPilRecommendations,
  mockFetchPolicy,
  resetPolicyMocks,
} from "./customer-policy-test-harness";

describe.skip("CustomerPoliciesPage — advanced recommendation tiering", () => {
  beforeEach(() => {
    resetPolicyMocks();
  });

  it("free tier shows gated upgrade teaser when PIL gated data exists", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
    mockFetchPilRecommendations.mockResolvedValue({
      recommendations: [],
      record_count: 42,
      confidence_summary: "medium",
      captured_at: Date.now() / 1000,
      plan: "free",
      gated: true,
      gated_count: 3,
    });

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-upgrade-teaser")).toBeTruthy();
    });

    expect(screen.getByTestId("teaser-headline")).toBeTruthy();
    expect(screen.getByTestId("recommendation-upgrade-link")).toBeTruthy();
  });

  it("pro tier surfaces customer-history and intelligence sources", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchPilRecommendations.mockResolvedValue({
      recommendations: [
        {
          id: "REDUCE_SLIPPAGE",
          title: "Reduce slippage tolerance",
          explanation: "Slippage pressure is high.",
          parameter: "max_slippage_bps",
          confidence: "high",
          evidence: "avg_slippage=95bps",
        },
      ],
      record_count: 42,
      confidence_summary: "medium",
      captured_at: Date.now() / 1000,
      plan: "pro",
      gated: false,
      gated_count: 0,
    });

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    const sourceLabels = screen.getAllByTestId("recommendation-source").map((el) => el.textContent);
    expect(sourceLabels).toContain("Customer history");
    expect(sourceLabels).toContain("Policy Intelligence");
    expect(screen.queryByTestId("recommendation-upgrade-teaser")).toBeNull();
  });

  it("single gated source hides source detail list", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    mockFetchReceiptSummary.mockResolvedValue({ ...HISTORY_SUMMARY, total_receipts: 0 });
    mockFetchMarketConditions.mockResolvedValue(MARKET_STABLE);
    mockFetchPilRecommendations.mockResolvedValue({
      recommendations: [],
      record_count: 42,
      confidence_summary: "medium",
      captured_at: Date.now() / 1000,
      plan: "free",
      gated: true,
      gated_count: 1,
    });

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-upgrade-teaser")).toBeTruthy();
    });

    expect(screen.queryByTestId("gated-source-details")).toBeNull();
  });
});
