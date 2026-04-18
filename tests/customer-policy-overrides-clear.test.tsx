/**
 * customer-policy-overrides-clear.test.tsx
 *
 * Covers the clear-override UX for CustomerPoliciesPage (Prompt 221).
 *
 * Specifically tests `require_simulation_success` (boolean field) because
 * that is the first field with clear-override support.  Future numeric/list
 * field clear UX should be added here once the product surface is extended.
 *
 * Product signals this file depends on:
 *   - data-testid="clear-override-{fieldKey}"   — the clear button
 *   - data-testid="override-status-{fieldKey}"  — the status text element
 *   - "Using plan default" / "Custom override active" status copy
 *   - null sent in save payload to explicitly remove an override
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  FREE_POLICY,
  PRO_POLICY,
  PRO_WITH_SIM_OVERRIDE,
  PRO_WITH_SIM_OVERRIDE_TRUE,
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

describe("CustomerPoliciesPage — clear override UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchReceiptSummary.mockResolvedValue(EMPTY_HISTORY_SUMMARY);
    mockFetchMarketConditions.mockResolvedValue(MARKET_STABLE);
    mockFetchPilRecommendations.mockResolvedValue(EMPTY_PIL);
    mockFetchCohortBenchmarks.mockResolvedValue(EMPTY_BENCHMARKS);
    mockFetchExternalContext.mockResolvedValue(EMPTY_EXTERNAL);
  });

  // -----------------------------------------------------------------------
  // Badge rendering (view mode)
  // -----------------------------------------------------------------------

  describe("Override / Default badge in policy-rules", () => {
    it("shows Override badge for require_simulation_success when overridden", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_WITH_SIM_OVERRIDE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-rules")).toBeTruthy();
      });

      const rules = screen.getByTestId("policy-rules");
      const badges = Array.from(rules.querySelectorAll("span")).map(
        (el) => el.textContent,
      );
      expect(badges.some((t) => t === "Override")).toBe(true);
    });

    it("shows Default badge for require_simulation_success when not overridden", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-rules")).toBeTruthy();
      });

      const rules = screen.getByTestId("policy-rules");
      const badges = Array.from(rules.querySelectorAll("span")).map(
        (el) => el.textContent,
      );
      expect(badges.some((t) => t === "Override")).toBe(false);
      expect(badges.some((t) => t === "Default")).toBe(true);
    });

    it("shows Override badge when require_simulation_success=true is explicitly overridden", async () => {
      // Even if the override value matches the plan default (true), the badge
      // should show "Override" because the key is present in stored overrides.
      mockFetchPolicy.mockResolvedValue(PRO_WITH_SIM_OVERRIDE_TRUE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByTestId("policy-rules")).toBeTruthy();
      });

      const rules = screen.getByTestId("policy-rules");
      const badges = Array.from(rules.querySelectorAll("span")).map(
        (el) => el.textContent,
      );
      expect(badges.some((t) => t === "Override")).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Clear override button visibility (edit mode)
  // -----------------------------------------------------------------------

  describe("Clear override button visibility", () => {
    it("shows Clear override button in edit mode when override exists", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_WITH_SIM_OVERRIDE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      await waitFor(() => {
        expect(
          screen.getByTestId("clear-override-require_simulation_success"),
        ).toBeTruthy();
      });
    });

    it("does not show Clear override button in edit mode when no override exists", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      await waitFor(() => {
        // Confirm we are in edit mode
        expect(screen.getByText("Save Overrides")).toBeTruthy();
      });

      expect(
        screen.queryByTestId("clear-override-require_simulation_success"),
      ).toBeNull();
    });

    it("does not show Clear override controls for free-tier users", async () => {
      mockFetchPolicy.mockResolvedValue(FREE_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        // Free tier has no Edit Overrides button
        expect(screen.queryByText("Edit Overrides")).toBeNull();
      });

      expect(
        screen.queryByTestId("clear-override-require_simulation_success"),
      ).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Clear override interaction
  // -----------------------------------------------------------------------

  describe("Clear override interaction", () => {
    it("clicking Clear override resets select to Plan default", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_WITH_SIM_OVERRIDE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const select = (await screen.findByRole("combobox", {
        name: /Require Simulation Success/i,
      })) as HTMLSelectElement;

      // Initially shows "No" (false override)
      expect(select.value).toBe("false");

      const clearBtn = screen.getByTestId(
        "clear-override-require_simulation_success",
      );
      fireEvent.click(clearBtn);

      // Select should reset to "" (Plan default)
      expect(select.value).toBe("");
    });

    it("shows 'Using plan default' status text after clicking Clear override", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_WITH_SIM_OVERRIDE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Initially "Custom override active" is shown for the overridden field
      await waitFor(() => {
        expect(screen.getByText("Custom override active")).toBeTruthy();
      });

      const clearBtn = screen.getByTestId(
        "clear-override-require_simulation_success",
      );
      fireEvent.click(clearBtn);

      // Status should update to "Using plan default"
      await waitFor(() => {
        expect(screen.getByText("Using plan default")).toBeTruthy();
      });
    });

    it("Clear override button disappears after clicking (field reverts to Plan default)", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_WITH_SIM_OVERRIDE);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      await waitFor(() => {
        expect(
          screen.getByTestId("clear-override-require_simulation_success"),
        ).toBeTruthy();
      });

      fireEvent.click(
        screen.getByTestId("clear-override-require_simulation_success"),
      );

      // Button should be gone after clearing (value is now "")
      await waitFor(() => {
        expect(
          screen.queryByTestId("clear-override-require_simulation_success"),
        ).toBeNull();
      });
    });
  });

  // -----------------------------------------------------------------------
  // Save payload after clear
  // -----------------------------------------------------------------------

  describe("Save payload after clear override", () => {
    it("save after clear override sends null for cleared field", async () => {
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: {},
        message: "Policy overrides updated successfully.",
      });
      mockFetchPolicy
        .mockResolvedValueOnce(PRO_WITH_SIM_OVERRIDE)
        .mockResolvedValueOnce({
          ...PRO_POLICY,
          overrides: {},
          effective: {
            ...PRO_POLICY.effective,
            require_simulation_success: true,
          },
        });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Clear the override
      await waitFor(() => {
        expect(
          screen.getByTestId("clear-override-require_simulation_success"),
        ).toBeTruthy();
      });
      fireEvent.click(
        screen.getByTestId("clear-override-require_simulation_success"),
      );

      // Save
      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledWith(
          expect.objectContaining({ require_simulation_success: null }),
        );
      });
    });
  });
});
