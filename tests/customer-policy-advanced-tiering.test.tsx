import "./customer-policy-test-mocks";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CustomerPoliciesPage from "@/app/customer/policies/page";
import {
  ADVANCED_POLICY,
  EMPTY_HISTORY_SUMMARY,
  ENTERPRISE_POLICY,
  EXTERNAL_CONTEXT_RESPONSE,
  FREE_POLICY,
  HISTORY_SUMMARY,
  MARKET_DEGRADED,
  mockFetchExternalContext,
  mockFetchMarketConditions,
  mockFetchPilRecommendations,
  mockFetchPolicy,
  mockFetchReceiptSummary,
  PIL_GATED_RESPONSE,
  PRO_POLICY,
  resetCustomerPolicyPageMocks,
} from "./customer-policy-page-testkit";

describe("CustomerPoliciesPage — plan-aware recommendation tiering", () => {
  beforeEach(() => {
    resetCustomerPolicyPageMocks();
  });

  it("Free plan shows only Default guidance and Policy analysis sources", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
    mockFetchPilRecommendations.mockResolvedValue(PIL_GATED_RESPONSE);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    const sourceLabels = screen.getAllByTestId("recommendation-source").map((el) => el.textContent);
    for (const label of sourceLabels) {
      expect(label === "Default guidance" || label === "Policy analysis").toBe(true);
    }
    expect(sourceLabels).not.toContain("Customer history");
    expect(sourceLabels).not.toContain("Market analysis");
    expect(sourceLabels).not.toContain("Policy Intelligence");
  });

  it("Free plan shows upgrade teaser when gated sources have data", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
    mockFetchPilRecommendations.mockResolvedValue(PIL_GATED_RESPONSE);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-upgrade-teaser")).toBeTruthy();
    });

    expect(screen.getByTestId("teaser-headline").textContent).toMatch(/Unlock .+ policy|Unlock .+ suggestions|Unlock .+ benchmarks|Unlock .+ signals|Unlock .+ history/);
    expect(screen.getByTestId("recommendation-upgrade-link")).toBeTruthy();
  });

  it("upgrade teaser mentions gated PIL count when available", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(EMPTY_HISTORY_SUMMARY);
    mockFetchPilRecommendations.mockResolvedValue(PIL_GATED_RESPONSE);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-upgrade-teaser")).toBeTruthy();
    });

    expect(screen.getByTestId("recommendation-upgrade-teaser").textContent).toContain("3 intelligence-backed suggestions");
  });

  it("teaser CTA uses source-specific wording", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
    mockFetchPilRecommendations.mockResolvedValue(PIL_GATED_RESPONSE);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-upgrade-link")).toBeTruthy();
    });

    expect(screen.getByTestId("recommendation-upgrade-link").textContent ?? "").toMatch(/Explore\s+Pro/i);
  });

  it("multi-source teaser shows gated source details with value-ranked order", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
    mockFetchPilRecommendations.mockResolvedValue(PIL_GATED_RESPONSE);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("gated-source-details")).toBeTruthy();
    });

    const items = screen.getByTestId("gated-source-details").querySelectorAll("li");
    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items[0].textContent ?? "").toContain("Policy Intelligence");
  });

  it("multi-source teaser bullet list marks the dominant source with a primary badge", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
    mockFetchPilRecommendations.mockResolvedValue(PIL_GATED_RESPONSE);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("gated-source-details")).toBeTruthy();
    });

    const badge = screen.getByTestId("teaser-primary-source-badge");
    expect(badge.textContent).toBe("primary");
    const firstItem = screen.getByTestId("gated-source-details").querySelectorAll("li")[0];
    expect(firstItem.contains(badge)).toBe(true);
  });

  it("Customer history ranks above Market analysis when PIL is not gated", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
    mockFetchPilRecommendations.mockResolvedValue({
      recommendations: [],
      record_count: 0,
      confidence_summary: "low",
      captured_at: Date.now() / 1000,
      plan: "free",
      gated: false,
      gated_count: 0,
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("gated-source-details")).toBeTruthy();
    });

    const items = screen.getByTestId("gated-source-details").querySelectorAll("li");
    expect(items[0].textContent).toContain("Customer history");
    expect(screen.getByTestId("teaser-headline").textContent).toContain("history");
  });

  it("Pro plan shows Customer history, Market analysis, and PIL recs without upgrade teaser", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
    mockFetchPilRecommendations.mockResolvedValue({
      recommendations: [{
        id: "REDUCE_SLIPPAGE",
        title: "Reduce slippage tolerance",
        explanation: "Slippage pressure is high.",
        parameter: "max_slippage_bps",
        confidence: "high",
        evidence: "avg_slippage=95bps",
      }],
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
    expect(sourceLabels).toContain("Policy Intelligence");
    expect(sourceLabels).toContain("Customer history");
    expect(screen.queryByTestId("recommendation-upgrade-teaser")).toBeNull();
  });

  it("Free plan with no gated data does not show upgrade teaser", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(EMPTY_HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(null);
    mockFetchPilRecommendations.mockResolvedValue({
      recommendations: [],
      record_count: 0,
      confidence_summary: "low",
      captured_at: Date.now() / 1000,
      plan: "free",
      gated: false,
      gated_count: 0,
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    expect(screen.queryByTestId("recommendation-upgrade-teaser")).toBeNull();
  });

  it("Advanced plan shows all recommendation sources like Pro", async () => {
    mockFetchPolicy.mockResolvedValue(ADVANCED_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
    mockFetchPilRecommendations.mockResolvedValue({
      recommendations: [{
        id: "REDUCE_SLIPPAGE",
        title: "Reduce slippage tolerance",
        explanation: "Slippage pressure is high.",
        parameter: "max_slippage_bps",
        confidence: "high",
        evidence: "avg_slippage=95bps",
      }],
      record_count: 42,
      confidence_summary: "medium",
      captured_at: Date.now() / 1000,
      plan: "advanced",
      gated: false,
      gated_count: 0,
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    const sourceLabels = screen.getAllByTestId("recommendation-source").map((el) => el.textContent);
    expect(sourceLabels).toContain("Policy Intelligence");
    expect(sourceLabels).toContain("Customer history");
    expect(screen.queryByTestId("recommendation-upgrade-teaser")).toBeNull();
  });

  it("Enterprise plan shows all recommendation sources including external context", async () => {
    mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchPilRecommendations.mockResolvedValue({
      recommendations: [{
        id: "REDUCE_SLIPPAGE",
        title: "Reduce slippage tolerance",
        explanation: "Slippage pressure is high.",
        parameter: "max_slippage_bps",
        confidence: "high",
        evidence: "avg_slippage=95bps",
      }],
      record_count: 42,
      confidence_summary: "medium",
      captured_at: Date.now() / 1000,
      plan: "enterprise",
      gated: false,
      gated_count: 0,
    });
    mockFetchExternalContext.mockResolvedValue(EXTERNAL_CONTEXT_RESPONSE);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    const sourceLabels = screen.getAllByTestId("recommendation-source").map((el) => el.textContent);
    expect(sourceLabels).toContain("Policy Intelligence");
    expect(sourceLabels).toContain("External context");
    expect(screen.queryByTestId("recommendation-upgrade-teaser")).toBeNull();
  });

  it("upgrade teaser supports single-source and few-source body copy variants", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_DEGRADED);
    mockFetchPilRecommendations.mockResolvedValue(PIL_GATED_RESPONSE);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-upgrade-teaser")).toBeTruthy();
    });
    expect(screen.getByTestId("recommendation-upgrade-teaser").textContent ?? "").toMatch(/\d+ intelligence sources\s*[—-]\s*led by/i);

    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(EMPTY_HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(null);
    mockFetchPilRecommendations.mockResolvedValue(PIL_GATED_RESPONSE);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getAllByTestId("recommendation-upgrade-teaser")[1]).toBeTruthy();
    });
    expect(screen.getAllByTestId("recommendation-upgrade-teaser")[1].textContent ?? "").toContain("higher-confidence intelligence-backed suggestions");
  });
});
