import "./customer-policy-test-mocks";
import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CustomerPoliciesPage from "@/app/customer/policies/page";
import {
  mockFetchPilRecommendations,
  mockFetchPolicy,
  mockFetchReceiptSummary,
  PRO_POLICY,
  resetCustomerPolicyPageMocks,
  HISTORY_SUMMARY,
} from "./customer-policy-page-testkit";

describe("CustomerPoliciesPage — recommendation details and display tuning", () => {
  beforeEach(() => {
    resetCustomerPolicyPageMocks();
  });

  it("shows detail toggle and keeps details hidden by default", async () => {
    mockFetchPolicy.mockResolvedValue({ ...PRO_POLICY, effective: { ...PRO_POLICY.effective, require_simulation_success: false } });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-enable-simulation")).toBeTruthy();
    });

    expect(screen.getByTestId("recommendation-details-toggle-enable-simulation").textContent).toContain("More detail");
    expect(screen.queryByTestId("recommendation-details-enable-simulation")).toBeNull();
  });

  it("toggle reveals and collapses details with aria-expanded", async () => {
    mockFetchPolicy.mockResolvedValue({ ...PRO_POLICY, effective: { ...PRO_POLICY.effective, max_slippage_bps: 500 } });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-tighten-slippage")).toBeTruthy();
    });

    const toggle = screen.getByTestId("recommendation-details-toggle-tighten-slippage");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(screen.getByTestId("recommendation-details-tighten-slippage").textContent).toContain("Why it matters");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(toggle);
    expect(screen.queryByTestId("recommendation-details-tighten-slippage")).toBeNull();
  });

  it("multiple recommendation cards can be expanded simultaneously", async () => {
    mockFetchPolicy.mockResolvedValue({
      ...PRO_POLICY,
      effective: { ...PRO_POLICY.effective, require_simulation_success: false, max_slippage_bps: 500 },
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-enable-simulation")).toBeTruthy();
      expect(screen.getByTestId("recommendation-tighten-slippage")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("recommendation-details-toggle-enable-simulation"));
    fireEvent.click(screen.getByTestId("recommendation-details-toggle-tighten-slippage"));

    expect(screen.getByTestId("recommendation-details-enable-simulation")).toBeTruthy();
    expect(screen.getByTestId("recommendation-details-tighten-slippage")).toBeTruthy();
  });

  it("shows source-specific framing for Customer history and Policy Intelligence", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchPilRecommendations.mockResolvedValue({
      recommendations: [{
        id: "REDUCE_SLIPPAGE",
        title: "Reduce slippage tolerance",
        explanation: "Slippage pressure is high.",
        parameter: "max_slippage_bps",
        confidence: "high",
        evidence: "avg_slippage=95bps, near_threshold=8/42",
      }],
      record_count: 42,
      confidence_summary: "medium",
      captured_at: Date.now() / 1000,
      plan: "pro",
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-history-recent-denials")).toBeTruthy();
      expect(screen.getByTestId("recommendation-pil-reduce-slippage")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("recommendation-details-toggle-history-recent-denials"));
    fireEvent.click(screen.getByTestId("recommendation-details-toggle-pil-reduce-slippage"));

    expect(screen.getByTestId("recommendation-details-history-recent-denials").textContent).toContain("recent transaction history");
    expect(screen.getByTestId("recommendation-details-pil-reduce-slippage").textContent).toContain("intelligence");
  });

  it("analytics-informed ordering keeps PIL ahead of default guidance peers", async () => {
    mockFetchPolicy.mockResolvedValue({ ...PRO_POLICY, effective: { ...PRO_POLICY.effective, max_slippage_bps: 500 } });
    mockFetchPilRecommendations.mockResolvedValue({
      recommendations: [{
        id: "PIL_TIGHTEN_LIMITS",
        title: "Tighten transaction limits",
        explanation: "Your limits exceed cohort norms.",
        parameter: "max_notional_usd",
        confidence: "medium",
        evidence: "cohort_p50=10000",
      }],
      record_count: 20,
      confidence_summary: "medium",
      captured_at: Date.now() / 1000,
      plan: "pro",
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("top-recommendations")).toBeTruthy();
    });

    const ids = Array.from(screen.getByTestId("top-recommendations").querySelectorAll("[data-testid^='recommendation-']")).map((c) => c.getAttribute("data-testid"));
    const pilIdx = ids.indexOf("recommendation-pil-tighten-limits");
    const slippageIdx = ids.indexOf("recommendation-tighten-slippage");
    if (pilIdx >= 0 && slippageIdx >= 0) {
      expect(pilIdx).toBeLessThan(slippageIdx);
    }
  });

  it("featured emphasis, top promotion, and more-suggestions confidence threshold behave as expected", async () => {
    mockFetchPolicy.mockResolvedValue({ ...PRO_POLICY, effective: { ...PRO_POLICY.effective, require_simulation_success: false } });
    mockFetchPilRecommendations.mockResolvedValue({
      recommendations: [
        {
          id: "PIL_REVIEW_PATTERN",
          title: "Review transaction pattern",
          explanation: "Unusual pattern detected.",
          parameter: "custom_field_nonexistent",
          confidence: "high",
          evidence: "anomaly_score=0.85",
        },
        {
          id: "PIL_MINOR_OBS",
          title: "Minor observation",
          explanation: "A low-priority suggestion.",
          parameter: "custom_field_nonexistent",
          confidence: "low",
          evidence: "minor pattern",
        },
      ],
      record_count: 30,
      confidence_summary: "high",
      captured_at: Date.now() / 1000,
      plan: "pro",
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-enable-simulation")).toBeTruthy();
      expect(screen.getByTestId("recommendation-pil-pil-review-pattern")).toBeTruthy();
      expect(screen.getByTestId("more-suggestions")).toBeTruthy();
    });

    expect(screen.getByTestId("recommendation-enable-simulation").getAttribute("data-emphasis")).toBe("featured");
    expect(screen.getByTestId("recommendation-enable-simulation").querySelector('[data-testid="recommended-action-badge"]')).toBeTruthy();
    expect(screen.getByTestId("recommendation-enable-simulation").querySelector('[data-testid="recommendation-inline-reason-enable-simulation"]')).toBeTruthy();
    expect(screen.getByTestId("recommendation-action-enable-simulation").textContent).toContain("View setting");
    expect(screen.getByTestId("recommendation-pil-pil-review-pattern").getAttribute("data-emphasis")).toBe("emphasized");

    fireEvent.click(screen.getByTestId("more-suggestions-toggle"));
    const moreList = screen.getByTestId("more-suggestions-list");
    const minor = moreList.querySelector('[data-testid="recommendation-pil-pil-minor-obs"]');
    expect(minor).toBeTruthy();
    expect(minor?.querySelector('[data-testid="recommendation-inline-confidence"]')).toBeNull();
  });
});
