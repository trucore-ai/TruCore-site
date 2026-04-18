/**
 * customer-policy-overrides-gating.test.tsx
 *
 * Covers plan-based visibility rules for the CustomerPoliciesPage:
 *   - Free plan: read-only, no edit controls, upsell footer
 *   - Pro plan: Edit Overrides button shown, form fields accessible
 *
 * Deliberately small so it runs without memory pressure.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  FREE_POLICY,
  PRO_POLICY,
  EMPTY_HISTORY_SUMMARY,
  MARKET_STABLE,
  EMPTY_PIL,
  EMPTY_BENCHMARKS,
  EMPTY_EXTERNAL,
} from "./helpers/render-customer-policies";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { mockPush, mockReplace } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
}));
vi.mock("next/navigation", () => {
  const stableRouter = { push: mockPush, replace: mockReplace };
  return { useRouter: () => stableRouter };
});

const mockFetchPolicy = vi.fn();
const mockUpdatePolicyOverrides = vi.fn();
const mockFetchReceiptSummary = vi.fn();
const mockFetchMarketConditions = vi.fn();
const mockFetchPilRecommendations = vi.fn();
const mockFetchCohortBenchmarks = vi.fn();
const mockFetchExternalContext = vi.fn();

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
    updatePolicyOverrides: (...args: unknown[]) =>
      mockUpdatePolicyOverrides(...args),
    fetchReceiptSummary: (...args: unknown[]) =>
      mockFetchReceiptSummary(...args),
    fetchMarketConditions: (...args: unknown[]) =>
      mockFetchMarketConditions(...args),
    fetchPilRecommendations: (...args: unknown[]) =>
      mockFetchPilRecommendations(...args),
    fetchCohortBenchmarks: (...args: unknown[]) =>
      mockFetchCohortBenchmarks(...args),
    fetchExternalContext: (...args: unknown[]) =>
      mockFetchExternalContext(...args),
    ApiError,
  };
});

import CustomerPoliciesPage from "@/app/customer/policies/page";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CustomerPoliciesPage — gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchReceiptSummary.mockResolvedValue(EMPTY_HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_STABLE);
    mockFetchPilRecommendations.mockResolvedValue(EMPTY_PIL);
    mockFetchCohortBenchmarks.mockResolvedValue(EMPTY_BENCHMARKS);
    mockFetchExternalContext.mockResolvedValue(EMPTY_EXTERNAL);
  });

  // -----------------------------------------------------------------------
  // Free plan — read-only
  // -----------------------------------------------------------------------

  describe("Free plan (read-only)", () => {
    it("renders policy data without edit controls", async () => {
      mockFetchPolicy.mockResolvedValue(FREE_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Policy & Protections")).toBeTruthy();
      });

      // Plan badge
      expect(screen.getAllByText("Free").length).toBeGreaterThanOrEqual(1);

      // No edit button
      expect(screen.queryByText("Edit Overrides")).toBeNull();

      // Shows upsell footer
      expect(
        screen.getByText(/Policy customization is available on Pro plans/),
      ).toBeTruthy();
    });

    it("shows 'Not available on this plan' for overrides status", async () => {
      mockFetchPolicy.mockResolvedValue(FREE_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Not available on this plan")).toBeTruthy();
      });
    });
  });

  // -----------------------------------------------------------------------
  // Pro plan — edit controls visible
  // -----------------------------------------------------------------------

  describe("Pro plan (editable)", () => {
    it("renders Edit Overrides button when overrides are enabled", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      // No upsell footer
      expect(
        screen.queryByText(/Policy customization is available on Pro plans/),
      ).toBeNull();
    });

    it("shows editable form fields when Edit Overrides is clicked", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Form fields visible
      expect(screen.getByLabelText("Max Slippage (bps)")).toBeTruthy();
      expect(
        screen.getByLabelText("Max Transaction Value (USD)"),
      ).toBeTruthy();
      expect(screen.getByLabelText("Max Value (SOL)")).toBeTruthy();
      expect(
        screen.getByLabelText("Require Simulation Success"),
      ).toBeTruthy();
      // List fields have labels displayed
      expect(screen.getByText("Allowed Programs")).toBeTruthy();
      expect(screen.getByText("Denied Programs")).toBeTruthy();

      // Action buttons
      expect(screen.getByText("Save Overrides")).toBeTruthy();
      expect(screen.getByText("Cancel")).toBeTruthy();
    });
  });
});
