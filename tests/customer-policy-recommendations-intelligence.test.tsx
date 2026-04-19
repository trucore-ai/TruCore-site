import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  CustomerPoliciesPage,
  PRO_POLICY,
  MARKET_DEGRADED,
  MARKET_STRESSED,
  mockFetchExternalContext,
  mockFetchMarketConditions,
  mockFetchPilRecommendations,
  mockFetchPolicy,
  resetPolicyMocks,
} from "./customer-policy-test-harness";

describe.skip("CustomerPoliciesPage — market, PIL, and external recommendations", () => {
  beforeEach(() => {
    resetPolicyMocks();
  });

  it("renders market-analysis recommendation under degraded conditions", async () => {
    mockFetchPolicy.mockResolvedValue({
      ...PRO_POLICY,
      effective: { ...PRO_POLICY.effective, require_simulation_success: false },
    });
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-market-enable-simulation")).toBeTruthy();
    });

    const labels = screen.getAllByTestId("recommendation-source").map((el) => el.textContent);
    expect(labels).toContain("Market analysis");
  });

  it("renders PIL recommendation with confidence and expandable details", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
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
    });

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-pil-reduce-slippage")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("recommendation-details-toggle-pil-reduce-slippage"));
    expect(screen.getByTestId("recommendation-details-pil-reduce-slippage").textContent).toContain("Signal basis");
  });

  it("renders external context recommendations on enterprise tier", async () => {
    mockFetchPolicy.mockResolvedValue({
      ...PRO_POLICY,
      plan_code: "enterprise",
      plan_limits: { tx_limit_per_month: 1000000, policy_overrides_enabled: true },
      effective: { ...PRO_POLICY.effective, max_notional_usd: 100000 },
    });
    mockFetchMarketConditions.mockResolvedValue(MARKET_STRESSED);
    mockFetchExternalContext.mockResolvedValue({
      recommendations: [
        {
          id: "EXT_SUSTAINED_THROTTLE",
          title: "Sustained external network pressure detected",
          explanation: "Execution environment has sustained throttling.",
          parameter: "require_simulation_success",
          confidence: "high",
          evidence: "6 consecutive minutes",
        },
      ],
      captured_at: Date.now() / 1000,
      plan: "enterprise",
      gated: false,
      gated_count: 0,
    });

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-ext-ext-sustained-throttle")).toBeTruthy();
    });

    const labels = screen.getAllByTestId("recommendation-source").map((el) => el.textContent);
    expect(labels).toContain("External context");
  });
});
