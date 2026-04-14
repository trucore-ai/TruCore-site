import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: mockReplace }),
}));

const mockFetchPolicy = vi.fn();
const mockUpdatePolicyOverrides = vi.fn();

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
    ApiError,
  };
});

import CustomerPoliciesPage from "@/app/customer/policies/page";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FREE_POLICY = {
  plan_code: "free",
  plan_limits: { tx_limit_per_month: 100, policy_overrides_enabled: false },
  overrides: {},
  effective: {
    max_slippage_bps: 50,
    max_notional_usd: 1000,
    require_simulation_success: true,
  },
};

const PRO_POLICY = {
  plan_code: "pro",
  plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true },
  overrides: {},
  effective: {
    max_slippage_bps: 100,
    max_notional_usd: 25000,
    require_simulation_success: true,
  },
};

const PRO_POLICY_WITH_OVERRIDES = {
  plan_code: "pro",
  plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true },
  overrides: { max_slippage_bps: 200, max_notional_usd: 50000 },
  effective: {
    max_slippage_bps: 200,
    max_notional_usd: 50000,
    require_simulation_success: true,
  },
};

const PRO_POLICY_WITH_PROGRAMS = {
  plan_code: "pro",
  plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true },
  overrides: {
    max_slippage_bps: 100,
    allowed_programs: ["prog1", "prog2"],
    denied_programs: ["bad1"],
  },
  effective: {
    max_slippage_bps: 100,
    max_notional_usd: 25000,
    require_simulation_success: true,
    allowed_programs: ["prog1", "prog2"],
    denied_programs: ["bad1"],
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CustomerPoliciesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

      // Plan badge (appears in header text and badge)
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
  // Entitled plan — editable
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

    it("pre-populates form with current override values", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_OVERRIDES);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const slippageInput = screen.getByLabelText(
        "Max Slippage (bps)",
      ) as HTMLInputElement;
      expect(slippageInput.value).toBe("200");

      const notionalInput = screen.getByLabelText(
        "Max Transaction Value (USD)",
      ) as HTMLInputElement;
      expect(notionalInput.value).toBe("50000");
    });

    it("cancels edit mode without saving", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));
      expect(screen.getByText("Save Overrides")).toBeTruthy();

      fireEvent.click(screen.getByText("Cancel"));
      expect(screen.queryByText("Save Overrides")).toBeNull();
      expect(mockUpdatePolicyOverrides).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Successful save
  // -----------------------------------------------------------------------

  describe("save overrides", () => {
    it("saves overrides and refreshes policy data", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: { max_slippage_bps: 200 },
        message: "Policy overrides updated successfully",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      const callsBefore = mockFetchPolicy.mock.calls.length;

      fireEvent.click(screen.getByText("Edit Overrides"));

      const slippageInput = screen.getByLabelText("Max Slippage (bps)");
      fireEvent.change(slippageInput, { target: { value: "200" } });

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledTimes(1);
      });

      // The payload must contain max_slippage_bps: 200
      const payload = mockUpdatePolicyOverrides.mock.calls[0][0] as Record<string, unknown>;
      expect(payload.max_slippage_bps).toBe(200);

      // Should exit edit mode and show success
      await waitFor(() => {
        expect(screen.queryByText("Save Overrides")).toBeNull();
        expect(
          screen.getByText("Policy overrides saved successfully."),
        ).toBeTruthy();
      });

      // Policy should have been re-fetched after save
      expect(mockFetchPolicy.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    it("validates number fields before saving", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const slippageInput = screen.getByLabelText("Max Slippage (bps)");
      fireEvent.change(slippageInput, { target: { value: "99999" } });

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      // Should show validation error, not call API
      expect(
        screen.getByText(/must be a number between/),
      ).toBeTruthy();
      expect(mockUpdatePolicyOverrides).not.toHaveBeenCalled();
    });

    it("preserves non-editable overrides when saving", async () => {
      const policyWithExtraOverrides = {
        ...PRO_POLICY,
        overrides: {
          max_slippage_bps: 100,
          blocked_programs: ["program123"],
        },
      };
      mockFetchPolicy
        .mockResolvedValueOnce(policyWithExtraOverrides)
        .mockResolvedValueOnce(policyWithExtraOverrides);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: { max_slippage_bps: 150, blocked_programs: ["program123"] },
        message: "ok",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const slippageInput = screen.getByLabelText("Max Slippage (bps)");
      fireEvent.change(slippageInput, { target: { value: "150" } });

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledWith({
          max_slippage_bps: 150,
          blocked_programs: ["program123"],
        });
      });
    });
  });

  // -----------------------------------------------------------------------
  // Save failure
  // -----------------------------------------------------------------------

  describe("save failure", () => {
    it("shows error message and preserves form state", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockUpdatePolicyOverrides.mockRejectedValue(
        new Error("Your plan does not support policy overrides."),
      );

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const slippageInput = screen.getByLabelText(
        "Max Slippage (bps)",
      ) as HTMLInputElement;
      fireEvent.change(slippageInput, { target: { value: "150" } });

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(
          screen.getByText("Your plan does not support policy overrides."),
        ).toBeTruthy();
      });

      // Form should still be visible with user's values
      expect(screen.getByText("Save Overrides")).toBeTruthy();
      expect(
        (screen.getByLabelText("Max Slippage (bps)") as HTMLInputElement).value,
      ).toBe("150");
    });
  });

  // -----------------------------------------------------------------------
  // max_value_sol field
  // -----------------------------------------------------------------------

  describe("max_value_sol field", () => {
    it("saves max_value_sol as a number", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: { max_value_sol: 500 },
        message: "Policy overrides updated successfully",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const solInput = screen.getByLabelText("Max Value (SOL)");
      fireEvent.change(solInput, { target: { value: "500" } });

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledTimes(1);
      });

      const payload = mockUpdatePolicyOverrides.mock.calls[0][0] as Record<string, unknown>;
      expect(payload.max_value_sol).toBe(500);
    });

    it("validates max_value_sol range (1–100,000)", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const solInput = screen.getByLabelText("Max Value (SOL)");
      fireEvent.change(solInput, { target: { value: "999999" } });

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      expect(screen.getByText(/must be a number between/)).toBeTruthy();
      expect(mockUpdatePolicyOverrides).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Program list editors
  // -----------------------------------------------------------------------

  describe("program list editors", () => {
    it("pre-populates program lists from overrides", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_PROGRAMS);
      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Should show existing program items as tags
      expect(screen.getByText("prog1")).toBeTruthy();
      expect(screen.getByText("prog2")).toBeTruthy();
      expect(screen.getByText("bad1")).toBeTruthy();
    });

    it("adds programs to the allowed list and saves", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: { allowed_programs: ["newProg"] },
        message: "ok",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Type into the allowed programs input and press Enter
      const input = screen.getByLabelText("Allowed Programs");
      fireEvent.change(input, { target: { value: "newProg" } });
      fireEvent.keyDown(input, { key: "Enter" });

      // Tag should appear
      expect(screen.getByText("newProg")).toBeTruthy();

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledTimes(1);
      });

      const payload = mockUpdatePolicyOverrides.mock.calls[0][0] as Record<string, unknown>;
      expect(payload.allowed_programs).toEqual(["newProg"]);
    });

    it("removes a program from a list when × is clicked", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_PROGRAMS);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: { max_slippage_bps: 100, allowed_programs: ["prog2"], denied_programs: ["bad1"] },
        message: "ok",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Remove prog1
      const removeBtn = screen.getByLabelText("Remove prog1");
      fireEvent.click(removeBtn);

      // prog1 should be gone
      expect(screen.queryByText("prog1")).toBeNull();
      // prog2 should still be there
      expect(screen.getByText("prog2")).toBeTruthy();

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledTimes(1);
      });

      const payload = mockUpdatePolicyOverrides.mock.calls[0][0] as Record<string, unknown>;
      expect(payload.allowed_programs).toEqual(["prog2"]);
    });

    it("omits empty program lists from save payload", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockUpdatePolicyOverrides.mockResolvedValue({
        overrides: {},
        message: "ok",
      });

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      // Don't add any programs — just save
      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(mockUpdatePolicyOverrides).toHaveBeenCalledTimes(1);
      });

      const payload = mockUpdatePolicyOverrides.mock.calls[0][0] as Record<string, unknown>;
      // Empty lists should be omitted
      expect(payload.allowed_programs).toBeUndefined();
      expect(payload.denied_programs).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Backend validation errors (422)
  // -----------------------------------------------------------------------

  describe("backend validation errors", () => {
    it("displays 422 validation error from backend", async () => {
      mockFetchPolicy.mockResolvedValue(PRO_POLICY);
      mockUpdatePolicyOverrides.mockRejectedValue(
        new Error("Unsupported override key: bad_key"),
      );

      render(<CustomerPoliciesPage />);

      await waitFor(() => {
        expect(screen.getByText("Edit Overrides")).toBeTruthy();
      });

      fireEvent.click(screen.getByText("Edit Overrides"));

      const slippageInput = screen.getByLabelText("Max Slippage (bps)");
      fireEvent.change(slippageInput, { target: { value: "100" } });

      await act(async () => {
        fireEvent.click(screen.getByText("Save Overrides"));
      });

      await waitFor(() => {
        expect(
          screen.getByText("Unsupported override key: bad_key"),
        ).toBeTruthy();
      });
    });
  });
});
