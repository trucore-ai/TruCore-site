import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  EMPTY_HISTORY_SUMMARY,
  HISTORY_SUMMARY,
  MARKET_STABLE,
  PRO_POLICY,
  PRO_POLICY_WITH_OVERRIDES,
  PRO_POLICY_WITH_PROGRAMS,
  PRO_POLICY_WITH_TOKEN_POLICY,
} from "./customer-policy-page-testkit";

const mockFetchPolicy = vi.fn();
const mockUpdatePolicyOverrides = vi.fn();
const mockFetchReceiptSummary = vi.fn();
const mockFetchMarketConditions = vi.fn();
const mockFetchPilRecommendations = vi.fn();
const mockFetchCohortBenchmarks = vi.fn();
const mockFetchExternalContext = vi.fn();

const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}));

vi.mock("next/navigation", () => {
  const stableRouter = { push: mockPush, replace: mockReplace };
  return { useRouter: () => stableRouter };
});

vi.mock("@/lib/customer-auth", () => {
  class ApiError extends Error {
    code: string;
    retryAfterSeconds?: number;
    constructor(code: string, message: string, retryAfterSeconds?: number) {
      super(message);
      this.name = "ApiError";
      this.code = code;
      this.retryAfterSeconds = retryAfterSeconds;
    }
  }
  return {
    isLoggedIn: () => true,
    fetchPolicy: (...args: unknown[]) => mockFetchPolicy(...args),
    updatePolicyOverrides: (...args: unknown[]) => mockUpdatePolicyOverrides(...args),
    fetchReceiptSummary: (...args: unknown[]) => mockFetchReceiptSummary(...args),
    fetchMarketConditions: (...args: unknown[]) => mockFetchMarketConditions(...args),
    fetchPilRecommendations: (...args: unknown[]) => mockFetchPilRecommendations(...args),
    fetchCohortBenchmarks: (...args: unknown[]) => mockFetchCohortBenchmarks(...args),
    fetchExternalContext: (...args: unknown[]) => mockFetchExternalContext(...args),
    ApiError,
  };
});

import CustomerPoliciesPage from "@/app/customer/policies/page";

describe("CustomerPoliciesPage — core and history recommendations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it("renders the recommendations section and advisory disclaimer in view mode", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    expect(screen.getByText("Policy Recommendations")).toBeTruthy();
    expect(screen.getByText(/recommendations are advisory/)).toBeTruthy();
  });

  it("shows deterministic recommendations for unrestricted tokens, empty allowlist, simulation off, high slippage, missing program restrictions, and no overrides", async () => {
    mockFetchPolicy.mockResolvedValue({
      ...PRO_POLICY,
      overrides: { token_policy: { mode: "allowlist", allowed_mints: [], denied_mints: [] } },
      effective: {
        ...PRO_POLICY.effective,
        require_simulation_success: false,
        max_slippage_bps: 500,
        token_policy: { mode: "allowlist", allowed_mints: [], denied_mints: [] },
      },
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Add tokens to your allowlist").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Enable simulation requirement").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Tighten slippage tolerance").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Add program restrictions").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByTestId("recommendation-details-toggle-fix-empty-allowlist"));
    expect(screen.getByText(/empty allowlist prevents all token activity/)).toBeTruthy();
    expect(screen.getByText(/without passing simulation/)).toBeTruthy();
    expect(screen.getByText(/higher than most users/)).toBeTruthy();
  });

  it("entering edit mode hides the edit button and policy recommendations", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-policy-controls-cta")).toBeTruthy();
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));
    expect(screen.queryByTestId("edit-policy-controls-cta")).toBeNull();
    expect(screen.queryByTestId("policy-recommendations")).toBeNull();
    expect(screen.getByText("Save Policy Controls")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("shows source and priority labels and View setting action for editable recs", async () => {
    mockFetchPolicy.mockResolvedValue({
      ...PRO_POLICY,
      effective: { ...PRO_POLICY.effective, require_simulation_success: false },
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-action-enable-simulation")).toBeTruthy();
    });

    const sources = screen.getAllByTestId("recommendation-source").map((s) => s.textContent);
    expect(sources.every((t) => t === "Default guidance" || t === "Policy analysis" || t === "Policy Intelligence")).toBe(true);
    expect(screen.getAllByTestId("recommendation-priority").some((p) => p.textContent === "High priority")).toBe(true);
    expect(screen.getByTestId("recommendation-action-enable-simulation").textContent).toContain("View setting");
  });

  it("shows history-driven recommendations and suppresses them when history is unavailable or below threshold", async () => {
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchPolicy.mockResolvedValue({
      ...PRO_POLICY,
      effective: {
        ...PRO_POLICY.effective,
        max_notional_usd: 50000,
        max_slippage_bps: 500,
        require_simulation_success: false,
      },
    });
    let { unmount } = render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-history-limit-headroom")).toBeTruthy();
      expect(screen.getByTestId("recommendation-history-slippage-headroom")).toBeTruthy();
      expect(screen.getByTestId("recommendation-history-simulation-failures")).toBeTruthy();
      expect(screen.getByTestId("recommendation-history-narrow-tokens")).toBeTruthy();
      expect(screen.getByTestId("recommendation-history-narrow-programs")).toBeTruthy();
      expect(screen.getByTestId("recommendation-history-recent-denials")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("recommendation-details-toggle-history-recent-denials"));
    expect(screen.getByTestId("recommendation-history-recent-denials").textContent).toContain("30 days");
    expect(screen.getAllByText(/recent transaction history/).length).toBeGreaterThan(0);
    unmount();

    mockFetchReceiptSummary.mockRejectedValue(new Error("network error"));
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    ({ unmount } = render(<CustomerPoliciesPage />));

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });
    expect(screen.queryByTestId("recommendation-history-recent-denials")).toBeNull();
    unmount();

    mockFetchReceiptSummary.mockResolvedValue({ ...HISTORY_SUMMARY, total_receipts: 2 });
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });
    expect(screen.queryByTestId("recommendation-history-narrow-tokens")).toBeNull();
  });

  it("suppresses narrow-tokens and narrow-programs when policies are already constrained", async () => {
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_TOKEN_POLICY);
    const { unmount } = render(<CustomerPoliciesPage />);
    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });
    expect(screen.queryByTestId("recommendation-history-narrow-tokens")).toBeNull();
    unmount();

    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_PROGRAMS);
    render(<CustomerPoliciesPage />);
    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });
    expect(screen.queryByTestId("recommendation-history-narrow-programs")).toBeNull();
    expect(screen.queryByTestId("recommendation-add-program-restrictions")).toBeNull();
  });

  it("deterministic and history recommendations coexist without duplication", async () => {
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);
    mockFetchPolicy.mockResolvedValue({
      ...PRO_POLICY,
      effective: { ...PRO_POLICY.effective, require_simulation_success: false },
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-enable-simulation")).toBeTruthy();
      expect(screen.getByTestId("recommendation-history-simulation-failures")).toBeTruthy();
    });

    const cards = screen.getByTestId("recommendation-cards");
    expect(cards.querySelector('[data-testid="recommendation-enable-simulation"]')).toBeTruthy();
    expect(cards.querySelector('[data-testid="recommendation-history-simulation-failures"]')).toBeTruthy();
  });

  it("shows Override and Default source badges in the effective policy grid", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_OVERRIDES);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("source-badge-max_slippage_bps")).toBeTruthy();
    });

    expect(screen.getByTestId("source-badge-max_slippage_bps").textContent).toBe("Override");
    expect(screen.getByTestId("source-badge-require_simulation_success").textContent).toBe("Default");
  });
});
