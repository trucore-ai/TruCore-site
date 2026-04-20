import "./customer-policy-test-mocks";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CustomerPoliciesPage from "@/app/customer/policies/page";
import {
  EMPTY_HISTORY_SUMMARY,
  MARKET_STABLE,
  mockFetchCohortBenchmarks,
  mockFetchExternalContext,
  mockFetchMarketConditions,
  mockFetchPilRecommendations,
  mockFetchPolicy,
  mockFetchReceiptSummary,
  PRO_POLICY,
  resetCustomerPolicyPageMocks,
} from "./customer-policy-page-testkit";

const REC_HISTORY_KEY = "atf_policy_rec_history";

function setHistoryDefaults() {
  mockFetchReceiptSummary.mockResolvedValue(EMPTY_HISTORY_SUMMARY);
  mockFetchMarketConditions.mockResolvedValue(MARKET_STABLE);
  mockFetchPilRecommendations.mockResolvedValue({
    recommendations: [],
    record_count: 0,
    confidence_summary: "low",
    captured_at: Date.now() / 1000,
    plan: "pro",
  });
  mockFetchCohortBenchmarks.mockResolvedValue({
    benchmarks: [],
    cohort_size: 0,
    captured_at: Date.now() / 1000,
    plan: "pro",
  });
  mockFetchExternalContext.mockResolvedValue({
    recommendations: [],
    captured_at: Date.now() / 1000,
    plan: "pro",
  });
}

describe("CustomerPoliciesPage — recommendation history diff panel", () => {
  beforeEach(() => {
    resetCustomerPolicyPageMocks();
    localStorage.clear();
    setHistoryDefaults();
  });

  it("does not render on first visit or when the snapshot matches", async () => {
    localStorage.removeItem(REC_HISTORY_KEY);
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    const { unmount } = render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });
    expect(screen.queryByTestId("recommendation-history-panel")).toBeNull();
    unmount();

    localStorage.setItem(
      REC_HISTORY_KEY,
      JSON.stringify([
        { id: "add-program-restrictions", title: "Add program restrictions", source: "Default guidance" },
        { id: "customize-policy", title: "Customize your policy", source: "Default guidance" },
      ]),
    );
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });
    expect(screen.queryByTestId("recommendation-history-panel")).toBeNull();
  });

  it("renders resolved and new chips when recommendations change", async () => {
    localStorage.setItem(
      REC_HISTORY_KEY,
      JSON.stringify([
        { id: "enable-simulation", title: "Enable simulation requirement", source: "Default guidance" },
        { id: "restrict-tokens", title: "Restrict token access", source: "Default guidance" },
      ]),
    );
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-history-panel")).toBeTruthy();
    });

    expect(screen.getByText("What Changed Since Your Last Review")).toBeTruthy();
    expect(screen.getByTestId("history-resolved-enable-simulation").textContent).toContain("Resolved");
    const hasNew =
      screen.queryByTestId("history-new-add-program-restrictions") ||
      screen.queryByTestId("history-new-customize-policy");
    expect(hasNew).toBeTruthy();
  });

  it("renders only-new and resolved-only subtitle variants", async () => {
    localStorage.setItem(
      REC_HISTORY_KEY,
      JSON.stringify([{ id: "restrict-tokens", title: "Restrict token access", source: "Default guidance" }]),
    );
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    const { unmount } = render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-history-panel")).toBeTruthy();
    });

    expect(screen.getByTestId("history-new-customize-policy").textContent).toContain("New");
    unmount();

    localStorage.setItem(
      REC_HISTORY_KEY,
      JSON.stringify([
        { id: "restrict-tokens", title: "Restrict token access", source: "Default guidance" },
        { id: "add-program-restrictions", title: "Add program restrictions", source: "Default guidance" },
        { id: "customize-policy", title: "Customize your policy", source: "Default guidance" },
        { id: "extra-gone", title: "Some old recommendation", source: "Default guidance" },
      ]),
    );
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-history-panel")).toBeTruthy();
    });
    expect(screen.getByText(/resolved since your last visit/)).toBeTruthy();
    expect(screen.queryByText(/\d+ resolved, \d+ new since/)).toBeNull();
  });
});
