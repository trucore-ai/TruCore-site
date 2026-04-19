import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  CustomerPoliciesPage,
  PRO_POLICY,
  mockFetchPolicy,
  mockUpdatePolicyOverrides,
  resetPolicyMocks,
} from "./customer-policy-test-harness";

describe.skip("CustomerPoliciesPage — policy controls save flows", () => {
  beforeEach(() => {
    resetPolicyMocks();
  });

  it("saves overrides using Save Policy Controls action", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockUpdatePolicyOverrides.mockResolvedValue({
      overrides: { max_slippage_bps: 200 },
      message: "ok",
    });

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Policy Controls" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit Policy Controls" }));
    fireEvent.change(screen.getByLabelText("Max Slippage (bps)"), { target: { value: "200" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save Policy Controls" }));
    });

    await waitFor(() => {
      expect(mockUpdatePolicyOverrides).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("Policy Controls saved successfully.")).toBeTruthy();
  });

  it("validates numeric ranges before save", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Policy Controls" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit Policy Controls" }));
    fireEvent.change(screen.getByLabelText("Max Slippage (bps)"), { target: { value: "99999" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save Policy Controls" }));
    });

    expect(screen.getByText(/must be a number between/i)).toBeTruthy();
    expect(mockUpdatePolicyOverrides).not.toHaveBeenCalled();
  });

  it("retains form and shows backend error on save failure", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockUpdatePolicyOverrides.mockRejectedValue(new Error("Your plan does not support policy overrides."));

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Policy Controls" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit Policy Controls" }));
    fireEvent.change(screen.getByLabelText("Max Slippage (bps)"), { target: { value: "150" } });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save Policy Controls" }));
    });

    await waitFor(() => {
      expect(screen.getByText("Your plan does not support policy overrides.")).toBeTruthy();
    });

    expect(screen.getByRole("button", { name: "Save Policy Controls" })).toBeTruthy();
    expect((screen.getByLabelText("Max Slippage (bps)") as HTMLInputElement).value).toBe("150");
  });
});
