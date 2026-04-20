import "./customer-policy-test-mocks";
import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import CustomerPoliciesPage from "@/app/customer/policies/page";
import {
  mockFetchPolicy,
  PRO_POLICY,
  PRO_POLICY_WITH_OVERRIDES,
  PRO_POLICY_WITH_PROGRAMS,
  PRO_POLICY_WITH_TOKEN_POLICY,
  resetCustomerPolicyPageMocks,
} from "./customer-policy-page-testkit";

describe("CustomerPoliciesPage — previews and simulation", () => {
  beforeEach(() => {
    resetCustomerPolicyPageMocks();
  });

  it("renders policy-at-a-glance preview, rule copy, badges, and outcomes", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_OVERRIDES);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText("Policy at a Glance")).toBeTruthy();
    });

    expect(screen.getByTestId("policy-preview")).toBeTruthy();
    expect(screen.getByTestId("policy-rules")).toBeTruthy();
    expect(screen.getByText(/Transactions above \$50,000 USD will be denied|Transactions above \$25,000 USD will be denied/)).toBeTruthy();
    expect(screen.getByText(/Slippage is capped at 200 bps|Slippage is capped at 100 bps/)).toBeTruthy();
    expect(screen.getByText("Simulation must succeed before execution.")).toBeTruthy();
    const overrideTexts = Array.from(screen.getByTestId("policy-rules").querySelectorAll("span")).map((el) => el.textContent);
    expect(overrideTexts.some((t) => t === "Override")).toBe(true);
    expect(overrideTexts.some((t) => t === "Default")).toBe(true);
    expect(screen.getByTestId("policy-outcomes")).toBeTruthy();
    expect(screen.getByText("What this means")).toBeTruthy();
    expect(screen.getByText("If simulation fails, execution will not proceed.")).toBeTruthy();
  });

  it("renders token-policy-specific preview copy", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_TOKEN_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText(/2 approved tokens are permitted/)).toBeTruthy();
    });
  });

  it("renders simulation scenarios for limits, slippage, simulation failure, tokens, and blocked programs", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-simulation")).toBeTruthy();
    });

    expect(screen.getByText("How Your Policy Behaves")).toBeTruthy();
    expect(screen.getByTestId("simulation-scenarios")).toBeTruthy();
    expect(screen.getByText("Large USD transaction")).toBeTruthy();
    expect(screen.getByText(/Exceeds your \$25,000 USD transaction limit/)).toBeTruthy();
    expect(screen.getByText("Normal USD transaction")).toBeTruthy();
    expect(screen.getByText(/Within your \$25,000 USD transaction limit/)).toBeTruthy();
    expect(screen.getByText("High-slippage swap")).toBeTruthy();
    expect(screen.getByText(/Slippage exceeds your 100 bps cap/)).toBeTruthy();
    expect(screen.getByText("Failed simulation")).toBeTruthy();
    expect(screen.getByText(/requires simulation to succeed/)).toBeTruthy();
    const outcomeTexts = screen.getAllByTestId("scenario-outcome").map((b) => b.textContent);
    expect(outcomeTexts).toContain("Allowed");
    expect(outcomeTexts).toContain("Denied");
    expect(screen.getByText(/not live transactions/)).toBeTruthy();
  });

  it("renders allowlist and blocked-program scenarios when those policies are configured", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_TOKEN_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByText("Approved token swap")).toBeTruthy();
      expect(screen.getByText("Unlisted token swap")).toBeTruthy();
    });

    expect(screen.getByText(/on your approved token list/)).toBeTruthy();
    expect(screen.getByText(/Only tokens on your allowlist are permitted/)).toBeTruthy();

    mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_PROGRAMS);
    render(<CustomerPoliciesPage />);
    await waitFor(() => {
      expect(screen.getByText("Blocked program call")).toBeTruthy();
    });
    expect(screen.getByText(/on your block list/)).toBeTruthy();
  });
});
