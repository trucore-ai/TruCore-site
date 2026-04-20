import "./customer-policy-test-mocks";
import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CustomerPoliciesPage from "@/app/customer/policies/page";
import {
  ENTERPRISE_POLICY,
  EXTERNAL_CONTEXT_RESPONSE,
  HISTORY_SUMMARY,
  mockFetchExternalContext,
  mockFetchPilRecommendations,
  mockFetchPolicy,
  mockFetchReceiptSummary,
  PRO_POLICY,
  resetCustomerPolicyPageMocks,
} from "./customer-policy-page-testkit";

describe("CustomerPoliciesPage — PIL and external context recommendations", () => {
  beforeEach(() => {
    resetCustomerPolicyPageMocks();
  });

  const PIL_RESPONSE = {
    recommendations: [
      {
        id: "REDUCE_SLIPPAGE",
        title: "Reduce slippage tolerance",
        explanation: "Slippage pressure is high — many transactions are near the threshold.",
        parameter: "max_slippage_bps",
        confidence: "high",
        evidence: "avg_slippage=95bps, near_threshold=8/42",
      },
      {
        id: "HIGH_FRICTION",
        title: "Policy friction is elevated",
        explanation: "Denial rate is 12/42.  Review policy rules.",
        parameter: "max_notional_usd",
        confidence: "medium",
        evidence: "denial_rate=28.6%",
      },
    ],
    record_count: 42,
    confidence_summary: "medium",
    captured_at: Date.now() / 1000,
    plan: "pro",
  };

  it("renders PIL recs with source label, confidence, priority mapping, why text, evidence, and action buttons", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchPilRecommendations.mockResolvedValue(PIL_RESPONSE);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-pil-reduce-slippage")).toBeTruthy();
      expect(screen.getByTestId("recommendation-pil-high-friction")).toBeTruthy();
    });

    const card = screen.getByTestId("recommendation-pil-reduce-slippage");
    expect(card.textContent).toContain("Policy Intelligence");
    expect(card.textContent).toContain("High priority");
    expect(card.querySelector('[data-testid="recommendation-inline-confidence"]')?.textContent).toBe("High confidence");
    expect(screen.getByTestId("recommendation-action-pil-high-friction")).toBeTruthy();

    fireEvent.click(screen.getByTestId("recommendation-details-toggle-pil-reduce-slippage"));
    expect(screen.getByTestId("recommendation-details-pil-reduce-slippage").textContent).not.toContain("Signal basis:");
    expect(screen.getByTestId("recommendation-details-pil-reduce-slippage").textContent).toContain("avg_slippage=95bps");

    fireEvent.click(screen.getByTestId("recommendation-details-toggle-pil-high-friction"));
    const details = screen.getByTestId("recommendation-details-pil-high-friction");
    expect(details.textContent).toContain("A high denial rate means your policy may be blocking");
    expect(details.textContent).not.toContain("Denial rate is 12/42");
    expect(screen.getAllByText(/policy intelligence analysis/).length).toBeGreaterThan(0);
  });

  it("falls back correctly when PIL explanation or evidence is empty or ID is unknown", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchPilRecommendations.mockResolvedValue({
      recommendations: [
        {
          id: "REDUCE_SLIPPAGE",
          title: "Tighten your slippage cap now",
          explanation: "",
          parameter: "max_slippage_bps",
          confidence: "high",
          evidence: "",
        },
        {
          id: "UNKNOWN_SIGNAL_XYZ",
          title: "Unknown signal recommendation",
          explanation: "Something unusual was detected.",
          parameter: "max_notional_usd",
          confidence: "medium",
          evidence: "ratio=0.42",
        },
      ],
      record_count: 5,
      confidence_summary: "high",
      captured_at: Date.now() / 1000,
      plan: "pro",
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-pil-reduce-slippage")).toBeTruthy();
      expect(screen.getByTestId("recommendation-pil-unknown-signal-xyz")).toBeTruthy();
    });

    expect(screen.getByTestId("recommendation-pil-reduce-slippage").textContent).toContain("Tighten your slippage cap now");
    expect(screen.getByTestId("recommendation-pil-reduce-slippage").textContent).toContain("Consistently high slippage wastes value");

    fireEvent.click(screen.getByTestId("recommendation-details-toggle-pil-reduce-slippage"));
    expect(screen.getByTestId("recommendation-details-pil-reduce-slippage").textContent).not.toContain("Signal basis:");

    fireEvent.click(screen.getByTestId("recommendation-details-toggle-pil-unknown-signal-xyz"));
    const unknown = screen.getByTestId("recommendation-details-pil-unknown-signal-xyz");
    expect(unknown.textContent).toContain("Why it matters:");
    expect(unknown.textContent).not.toContain("Signal basis:");
    expect(unknown.textContent).toContain("ratio=0.42");
  });

  it("coexists with deterministic and history recs and degrades gracefully when unavailable", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchPilRecommendations.mockResolvedValue(PIL_RESPONSE);
    const { unmount } = render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    const sourceLabels = screen.getAllByTestId("recommendation-source").map((el) => el.textContent);
    expect(sourceLabels).toContain("Policy Intelligence");
    expect(sourceLabels.some((s) => s === "Default guidance" || s === "Policy analysis")).toBe(true);
    unmount();

    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchPilRecommendations.mockRejectedValue(new Error("network"));
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });
    expect(screen.getAllByTestId("recommendation-source").map((el) => el.textContent)).not.toContain("Policy Intelligence");
  });

  it("renders external context recs for enterprise only, with confidence, evidence, and graceful degradation", async () => {
    mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
    mockFetchExternalContext.mockResolvedValue(EXTERNAL_CONTEXT_RESPONSE);
    let { unmount } = render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-ext-ext-sustained-throttle")).toBeTruthy();
    });

    const ext = screen.getByTestId("recommendation-ext-ext-sustained-throttle");
    expect(ext.textContent).toContain("External context");
    expect(ext.querySelector('[data-testid="recommendation-inline-confidence"]')).toBeTruthy();
    fireEvent.click(screen.getByTestId("recommendation-details-toggle-ext-ext-sustained-throttle"));
    expect(screen.getByText(/sustained pressure for 6 consecutive/)).toBeTruthy();
    expect(screen.getAllByText(/external infrastructure signals/).length).toBeGreaterThan(0);
    unmount();

    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchExternalContext.mockResolvedValue(EXTERNAL_CONTEXT_RESPONSE);
    ({ unmount } = render(<CustomerPoliciesPage />));
    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });
    expect(screen.getAllByTestId("recommendation-source").map((el) => el.textContent)).not.toContain("External context");
    unmount();

    mockFetchPolicy.mockResolvedValue(ENTERPRISE_POLICY);
    mockFetchExternalContext.mockRejectedValue(new Error("network"));
    render(<CustomerPoliciesPage />);
    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });
    expect(screen.getAllByTestId("recommendation-source").map((el) => el.textContent)).not.toContain("External context");
  });
});
