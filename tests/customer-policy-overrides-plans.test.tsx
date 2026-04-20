import { describe, expect, it, beforeEach, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  EMPTY_HISTORY_SUMMARY,
  FREE_POLICY,
  MARKET_STABLE,
  PRO_POLICY,
  PRO_POLICY_WITH_OVERRIDES,
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

describe("CustomerPoliciesPage — plan controls and edit mode", () => {
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

  it("free plan stays read-only and shows upgrade messaging", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText("Policy & Protections")).toBeTruthy();
    });

    expect(screen.getAllByText("Free").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Edit Policy Controls")).toBeNull();
    expect(screen.getByText(/Policy customization is available on Pro plans/)).toBeTruthy();
    expect(screen.getByText("Not available on this plan")).toBeTruthy();
  });

  it("pro plan exposes edit mode with populated fields and cancel path", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_OVERRIDES);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-policy-controls-cta")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));
    expect(screen.getByLabelText("Max Transaction Value (USD)")).toBeTruthy();
    expect(screen.getByLabelText("Max Value (SOL)")).toBeTruthy();
    expect(screen.getByText("Require Simulation Success")).toBeTruthy();
    expect(screen.getByText("Allowed Programs")).toBeTruthy();
    expect(screen.getByText("Denied Programs")).toBeTruthy();
    expect((screen.getByLabelText("Max Slippage (bps)") as HTMLInputElement).value).toBe("200");
    expect((screen.getByLabelText("Max Transaction Value (USD)") as HTMLInputElement).value).toBe("50000");

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByText("Save Policy Controls")).toBeNull();
  });

  it("edit mode replaces the edit button with a cancel/save form", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-policy-controls-cta")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));
    // Edit button is gone; form controls appear
    expect(screen.queryByTestId("edit-policy-controls-cta")).toBeNull();
    expect(screen.getByText("Save Policy Controls")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
    // Recommendations section stays hidden when there are none
    expect(screen.queryByTestId("policy-recommendations")).toBeNull();
  });
});
