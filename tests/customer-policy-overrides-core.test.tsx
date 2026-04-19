import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  CustomerPoliciesPage,
  FREE_POLICY,
  PRO_POLICY,
  PRO_POLICY_WITH_OVERRIDES,
  PRO_POLICY_WITH_PROGRAMS,
  PRO_POLICY_WITH_TOKEN_POLICY,
  mockFetchPolicy,
  resetPolicyMocks,
} from "./customer-policy-test-harness";

describe.skip("CustomerPoliciesPage — policy controls core", () => {
  beforeEach(() => {
    resetPolicyMocks();
  });

  it("free plan shows read-only policy controls surface", async () => {
    mockFetchPolicy.mockResolvedValue(FREE_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-controls-surface")).toBeTruthy();
    });

    expect(screen.queryByRole("button", { name: "Edit Policy Controls" })).toBeNull();
    expect(screen.getByText("Pro or Enterprise required")).toBeTruthy();
  });

  it("pro plan exposes edit controls via robust button selector", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Policy Controls" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit Policy Controls" }));

    expect(screen.getByLabelText("Max Slippage (bps)")).toBeTruthy();
    expect(screen.getByLabelText("Max Transaction Value (USD)")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save Policy Controls" })).toBeTruthy();
  });

  it("pre-populates editable values from overrides", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_OVERRIDES);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Policy Controls" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit Policy Controls" }));

    expect((screen.getByLabelText("Max Slippage (bps)") as HTMLInputElement).value).toBe("200");
    expect((screen.getByLabelText("Max Transaction Value (USD)") as HTMLInputElement).value).toBe("50000");
  });

  it("program list editor renders existing program tags", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_PROGRAMS);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Policy Controls" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit Policy Controls" }));

    expect(screen.getByText("prog1")).toBeTruthy();
    expect(screen.getByText("prog2")).toBeTruthy();
    expect(screen.getByText("bad1")).toBeTruthy();
  });

  it("token policy editor initializes from override state", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_TOKEN_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Policy Controls" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit Policy Controls" }));

    expect(screen.getByTestId("token-mode-allowlist").className).toContain("border-amber");
    expect(screen.getByText("SOL")).toBeTruthy();
    expect(screen.getByText("USDC")).toBeTruthy();
  });
});
