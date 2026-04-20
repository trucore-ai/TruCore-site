import "./customer-policy-test-mocks";
import { describe, expect, it, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import CustomerPoliciesPage from "@/app/customer/policies/page";
import {
  mockFetchPolicy,
  mockUpdatePolicyOverrides,
  PRO_POLICY,
  resetCustomerPolicyPageMocks,
} from "./customer-policy-page-testkit";

describe("CustomerPoliciesPage — saving overrides", () => {
  beforeEach(() => {
    resetCustomerPolicyPageMocks();
  });

  it("saves numeric overrides, exits edit mode, and refreshes policy data", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockUpdatePolicyOverrides.mockResolvedValue({
      overrides: { max_slippage_bps: 200 },
      message: "Policy overrides updated successfully",
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-policy-controls-cta")).toBeTruthy();
    });

    const callsBefore = mockFetchPolicy.mock.calls.length;
    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));
    fireEvent.change(screen.getByLabelText("Max Slippage (bps)"), { target: { value: "200" } });

    await act(async () => {
      fireEvent.click(screen.getByText("Save Policy Controls"));
    });

    await waitFor(() => {
      expect(mockUpdatePolicyOverrides).toHaveBeenCalledTimes(1);
    });
    expect((mockUpdatePolicyOverrides.mock.calls[0][0] as Record<string, unknown>).max_slippage_bps).toBe(200);
    await waitFor(() => {
      expect(screen.queryByText("Save Policy Controls")).toBeNull();
      expect(screen.getByText("Policy Controls saved successfully.")).toBeTruthy();
    });
    expect(mockFetchPolicy.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it("validates ranges for slippage and max_value_sol before saving", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-policy-controls-cta")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));
    fireEvent.change(screen.getByLabelText("Max Slippage (bps)"), { target: { value: "99999" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save Policy Controls"));
    });
    expect(screen.getByText(/must be a number between/)).toBeTruthy();
    expect(mockUpdatePolicyOverrides).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Max Slippage (bps)"), { target: { value: "100" } });
    fireEvent.change(screen.getByLabelText("Max Value (SOL)"), { target: { value: "999999" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save Policy Controls"));
    });
    expect(screen.getByText(/must be a number between/)).toBeTruthy();
    expect(mockUpdatePolicyOverrides).not.toHaveBeenCalled();
  });

  it("preserves non-editable overrides and saves max_value_sol as a number", async () => {
    const policyWithExtraOverrides = {
      ...PRO_POLICY,
      overrides: {
        max_slippage_bps: 100,
        blocked_programs: ["program123"],
      },
    };
    mockFetchPolicy.mockResolvedValue(policyWithExtraOverrides);
    mockUpdatePolicyOverrides.mockResolvedValue({
      overrides: { max_value_sol: 500, blocked_programs: ["program123"] },
      message: "ok",
    });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-policy-controls-cta")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));
    fireEvent.change(screen.getByLabelText("Max Value (SOL)"), { target: { value: "500" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save Policy Controls"));
    });

    await waitFor(() => {
      expect(mockUpdatePolicyOverrides).toHaveBeenCalled();
    });
    expect(mockUpdatePolicyOverrides).toHaveBeenCalledWith({
      max_slippage_bps: 100,
      max_value_sol: 500,
      blocked_programs: ["program123"],
    });
  });

  it("shows backend and generic save failures while preserving form state", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockUpdatePolicyOverrides.mockRejectedValueOnce(new Error("Your plan does not support policy overrides."));
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-policy-controls-cta")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));
    fireEvent.change(screen.getByLabelText("Max Slippage (bps)"), { target: { value: "150" } });
    await act(async () => {
      fireEvent.click(screen.getByText("Save Policy Controls"));
    });

    await waitFor(() => {
      expect(screen.getByText("Your plan does not support policy overrides.")).toBeTruthy();
    });
    expect((screen.getByLabelText("Max Slippage (bps)") as HTMLInputElement).value).toBe("150");

    mockUpdatePolicyOverrides.mockRejectedValueOnce(new Error("Unsupported override key: bad_key"));
    await act(async () => {
      fireEvent.click(screen.getByText("Save Policy Controls"));
    });
    await waitFor(() => {
      expect(screen.getByText("Unsupported override key: bad_key")).toBeTruthy();
    });
  });
});
