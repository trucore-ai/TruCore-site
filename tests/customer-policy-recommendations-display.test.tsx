import "./customer-policy-test-mocks";
import { describe, expect, it, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CustomerPoliciesPage from "@/app/customer/policies/page";
import {
  mockFetchPilRecommendations,
  mockFetchPolicy,
  PRO_POLICY,
  resetCustomerPolicyPageMocks,
} from "./customer-policy-page-testkit";

describe("CustomerPoliciesPage — recommendation display prioritization", () => {
  beforeEach(() => {
    resetCustomerPolicyPageMocks();
  });

  it("places high-priority and medium actionable recommendations in the top section", async () => {
    mockFetchPolicy.mockResolvedValue({
      ...PRO_POLICY,
      effective: { ...PRO_POLICY.effective, require_simulation_success: false, max_slippage_bps: 500 },
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("top-recommendations")).toBeTruthy();
    });

    const topSection = screen.getByTestId("top-recommendations");
    expect(topSection.querySelector('[data-testid="recommendation-enable-simulation"]')).toBeTruthy();
    expect(topSection.querySelector('[data-testid="recommendation-tighten-slippage"]')).toBeTruthy();
  });

  it("keeps low-priority cards in more-suggestions with hidden-by-default list and accurate aria state", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("more-suggestions")).toBeTruthy();
    });

    const toggle = screen.getByTestId("more-suggestions-toggle");
    const list = screen.getByTestId("more-suggestions-list");
    expect(list.className).toContain("hidden");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.textContent).toMatch(/more suggestion/);

    fireEvent.click(toggle);
    expect(list.className).not.toContain("hidden");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(list.querySelector('[data-testid="recommendation-add-program-restrictions"]')).toBeTruthy();
  });

  it("sorts actionable peers before non-actionable and applies featured/emphasized/standard emphasis", async () => {
    mockFetchPolicy.mockResolvedValue({
      ...PRO_POLICY,
      effective: {
        ...PRO_POLICY.effective,
        require_simulation_success: false,
        max_slippage_bps: 500,
        token_policy: { mode: "unrestricted", allowed_mints: [], denied_mints: [] },
      },
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-enable-simulation")).toBeTruthy();
      expect(screen.getByTestId("recommendation-tighten-slippage")).toBeTruthy();
      expect(screen.getByTestId("recommendation-restrict-tokens")).toBeTruthy();
    });

    expect(screen.getByTestId("recommendation-enable-simulation").getAttribute("data-emphasis")).toBe("featured");
    expect(screen.getByTestId("recommendation-enable-simulation").querySelector('[data-testid="recommended-action-badge"]')).toBeTruthy();
    expect(screen.getByTestId("recommendation-enable-simulation").querySelector('[data-testid="recommendation-inline-reason-enable-simulation"]')).toBeTruthy();
    expect(screen.getByTestId("recommendation-details-toggle-enable-simulation").textContent).toContain("More detail");
    expect(screen.getByTestId("recommendation-action-enable-simulation").textContent).toContain("View setting");

    expect(screen.getByTestId("recommendation-tighten-slippage").getAttribute("data-emphasis")).toBe("emphasized");

    fireEvent.click(screen.getByTestId("more-suggestions-toggle"));
    const firstMoreCard = screen.getByTestId("more-suggestions-list").querySelector("[data-emphasis]");
    expect(firstMoreCard?.getAttribute("data-emphasis")).toBe("standard");
  });

  it("shows inline confidence on top high-confidence PIL recs", async () => {
    mockFetchPolicy.mockResolvedValue({
      ...PRO_POLICY,
      effective: { ...PRO_POLICY.effective, require_simulation_success: false },
    });
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
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-pil-reduce-slippage")).toBeTruthy();
    });

    expect(screen.getByTestId("recommendation-pil-reduce-slippage").querySelector('[data-testid="recommendation-inline-confidence"]')).toBeTruthy();
  });
});
