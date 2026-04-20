import "./customer-policy-test-mocks";
import { describe, expect, it, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import CustomerPoliciesPage from "@/app/customer/policies/page";
import {
  mockFetchPolicy,
  mockUpdatePolicyOverrides,
  PRO_POLICY,
  PRO_POLICY_WITH_PROGRAMS,
  PRO_POLICY_WITH_TOKEN_POLICY,
  resetCustomerPolicyPageMocks,
} from "./customer-policy-page-testkit";

describe("CustomerPoliciesPage — program and token list editors", () => {
  beforeEach(() => {
    resetCustomerPolicyPageMocks();
  });

  it("pre-populates, adds, removes, and omits program lists as expected", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_PROGRAMS);
    const { unmount } = render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-policy-controls-cta")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));
    expect(screen.getByText("prog1")).toBeTruthy();
    expect(screen.getByText("prog2")).toBeTruthy();
    expect(screen.getByText("bad1")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Remove prog1"));
    expect(screen.queryByText("prog1")).toBeNull();
    unmount();

    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockUpdatePolicyOverrides.mockResolvedValue({ overrides: { allowed_programs: ["newProg"] }, message: "ok" });
    render(<CustomerPoliciesPage />);
    await waitFor(() => {
      expect(screen.getByTestId("edit-policy-controls-cta")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));
    const input = screen.getByLabelText("Allowed Programs");
    fireEvent.change(input, { target: { value: "newProg" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("newProg")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByText("Save Policy Controls"));
    });
    await waitFor(() => {
      expect(mockUpdatePolicyOverrides).toHaveBeenCalled();
    });
    expect((mockUpdatePolicyOverrides.mock.calls.at(-1)?.[0] as Record<string, unknown>).allowed_programs).toEqual(["newProg"]);
  });

  it("token policy editor switches modes, manages chips, and serializes allowlist/denylist payloads", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_TOKEN_POLICY);
    const { unmount } = render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-policy-controls-cta")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));

    expect(screen.getByText("Token Access Policy")).toBeTruthy();
    expect(screen.getByTestId("token-mode-allowlist").className).toContain("border-amber");
    expect(screen.getByText("SOL")).toBeTruthy();
    expect(screen.getByText("USDC")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Remove SOL"));
    expect(screen.queryByLabelText("Remove SOL")).toBeNull();
    unmount();

    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockUpdatePolicyOverrides.mockResolvedValue({
      overrides: { token_policy: { mode: "allowlist", allowed_mints: ["SOL", "customMint123"], denied_mints: [] } },
      message: "ok",
    });
    render(<CustomerPoliciesPage />);
    await waitFor(() => {
      expect(screen.getByTestId("edit-policy-controls-cta")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));
    expect(screen.queryByPlaceholderText("Token symbol or mint address")).toBeNull();
    fireEvent.click(screen.getByTestId("token-mode-allowlist"));
    expect(screen.getByText("Quick add popular tokens:")).toBeTruthy();
    fireEvent.click(screen.getByText("+ SOL"));
    const mintInput = screen.getByPlaceholderText("Token symbol or mint address");
    fireEvent.change(mintInput, { target: { value: "customMint123" } });
    fireEvent.keyDown(mintInput, { key: "Enter" });
    await act(async () => {
      fireEvent.click(screen.getByText("Save Policy Controls"));
    });
    await waitFor(() => {
      expect(mockUpdatePolicyOverrides).toHaveBeenCalled();
    });
    expect(mockUpdatePolicyOverrides).toHaveBeenCalledWith(expect.objectContaining({
      token_policy: {
        mode: "allowlist",
        allowed_mints: ["SOL", "customMint123"],
        denied_mints: [],
      },
    }));

    // Re-enter edit mode for the second save (save exits edit mode)
    await waitFor(() => {
      expect(screen.getByTestId("edit-policy-controls-cta")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));

    mockUpdatePolicyOverrides.mockResolvedValue({
      overrides: { token_policy: { mode: "denylist", allowed_mints: [], denied_mints: ["BONK"] } },
      message: "ok",
    });
    fireEvent.click(screen.getByTestId("token-mode-denylist"));
    fireEvent.click(screen.getByText("+ BONK"));
    await act(async () => {
      fireEvent.click(screen.getByText("Save Policy Controls"));
    });
    expect(mockUpdatePolicyOverrides).toHaveBeenCalledWith(expect.objectContaining({
      token_policy: {
        mode: "denylist",
        allowed_mints: [],
        denied_mints: ["BONK"],
      },
    }));
  });

  it("omits token policy when unrestricted and cancel resets unsaved token changes", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockUpdatePolicyOverrides.mockResolvedValue({ overrides: {}, message: "ok" });
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-policy-controls-cta")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));
    expect(screen.getByTestId("token-mode-unrestricted").className).toContain("border-amber");
    await act(async () => {
      fireEvent.click(screen.getByText("Save Policy Controls"));
    });
    expect((mockUpdatePolicyOverrides.mock.calls[0][0] as Record<string, unknown>).token_policy).toBeUndefined();

    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));
    fireEvent.click(screen.getByTestId("token-mode-allowlist"));
    fireEvent.click(screen.getByText("+ SOL"));
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => {
      expect(screen.getByTestId("edit-policy-controls-cta")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("edit-policy-controls-cta"));
    expect(screen.getByTestId("token-mode-unrestricted").className).toContain("border-amber");
  });
});
