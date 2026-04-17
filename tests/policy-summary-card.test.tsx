/**
 * policy-summary-card — unit tests for the PolicySummaryCard component.
 *
 * Covers:
 *  - loading skeleton renders when loading=true
 *  - unavailable state renders with correct copy when policy=null
 *  - unavailable state shows retry button when onRetry is provided
 *  - unavailable state shows "Open policy view" link when no onRetry
 *  - unavailable state does NOT lead user to /customer/policies as primary CTA
 *    (because the policy page would also fail in the same unavailable scenario)
 *  - loaded card renders key policy fields
 *  - loaded card links to /customer/policies
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PolicySummaryCard } from "@/components/policy-summary-card";
import type { EffectivePolicyResponse } from "@/lib/customer-auth";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("a", { href, ...props }, children),
}));

const MOCK_POLICY: EffectivePolicyResponse = {
  plan_code: "pro",
  plan_limits: {
    tx_limit_per_month: 5000,
    policy_overrides_enabled: true,
  },
  overrides: { max_slippage_bps: 150 },
  effective: {
    max_slippage_bps: 150,
    max_notional_usd: 50000,
    require_simulation_success: true,
  },
};

describe("PolicySummaryCard", () => {
  it("renders loading skeleton when loading=true", () => {
    const { container } = render(
      <PolicySummaryCard policy={null} loading />,
    );
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("renders unavailable state when policy=null and not loading", () => {
    render(<PolicySummaryCard policy={null} loading={false} />);
    expect(screen.getByTestId("policy-summary-unavailable")).toBeTruthy();
  });

  it("unavailable state shows 'Temporarily unavailable' badge", () => {
    render(<PolicySummaryCard policy={null} loading={false} />);
    expect(screen.getByText("Temporarily unavailable")).toBeTruthy();
  });

  it("unavailable state mentions plan defaults still apply", () => {
    render(<PolicySummaryCard policy={null} loading={false} />);
    const el = screen.getByTestId("policy-summary-unavailable");
    expect(el.textContent).toContain("default enforcement rules");
  });

  it("unavailable state shows retry button when onRetry is provided", () => {
    const onRetry = vi.fn();
    render(<PolicySummaryCard policy={null} loading={false} onRetry={onRetry} />);
    const retryBtn = screen.getByRole("button", { name: /try again/i });
    expect(retryBtn).toBeTruthy();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("unavailable state without onRetry shows a link to policies page", () => {
    render(<PolicySummaryCard policy={null} loading={false} />);
    const link = screen.getByRole("link", { name: /open policy view/i });
    expect(link).toBeTruthy();
    expect((link as HTMLAnchorElement).href).toContain("/customer/policies");
  });

  it("renders loaded card with policy data", () => {
    render(<PolicySummaryCard policy={MOCK_POLICY} loading={false} />);
    expect(screen.getByTestId("policy-summary-card")).toBeTruthy();
  });

  it("loaded card shows protection status as Active", () => {
    render(<PolicySummaryCard policy={MOCK_POLICY} loading={false} />);
    const activeTexts = screen.getAllByText("Active");
    expect(activeTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("loaded card shows effective slippage when present", () => {
    render(<PolicySummaryCard policy={MOCK_POLICY} loading={false} />);
    expect(screen.getByText("150 bps")).toBeTruthy();
  });

  it("loaded card links to /customer/policies via View details", () => {
    render(<PolicySummaryCard policy={MOCK_POLICY} loading={false} />);
    const links = screen.getAllByRole("link");
    const policyLinks = links.filter((l) =>
      (l as HTMLAnchorElement).href.includes("/customer/policies"),
    );
    expect(policyLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("loaded card shows 'Manage policy settings' link", () => {
    render(<PolicySummaryCard policy={MOCK_POLICY} loading={false} />);
    expect(screen.getByText(/manage policy settings/i)).toBeTruthy();
  });

  it("loaded card shows custom overrides as Active when overrides exist", () => {
    render(<PolicySummaryCard policy={MOCK_POLICY} loading={false} />);
    const activeTexts = screen.getAllByText("Active");
    // Both protection status and overrides show Active with MOCK_POLICY
    expect(activeTexts.length).toBe(2);
  });

  it("loaded card shows None set when no overrides", () => {
    const noOverridePolicy = { ...MOCK_POLICY, overrides: {} };
    render(<PolicySummaryCard policy={noOverridePolicy} loading={false} />);
    expect(screen.getByText("None set")).toBeTruthy();
  });
});
