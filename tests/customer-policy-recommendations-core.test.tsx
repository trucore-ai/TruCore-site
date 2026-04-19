import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  CustomerPoliciesPage,
  PRO_POLICY,
  PRO_POLICY_WITH_PROGRAMS,
  HISTORY_SUMMARY,
  mockFetchPolicy,
  mockFetchReceiptSummary,
  resetPolicyMocks,
} from "./customer-policy-test-harness";

describe.skip("CustomerPoliciesPage — recommendation core and display", () => {
  beforeEach(() => {
    resetPolicyMocks();
  });

  it("renders recommendation section and default guidance cards", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    expect(screen.getByText("Policy Recommendations")).toBeTruthy();
    expect(screen.getByTestId("recommendation-add-program-restrictions")).toBeTruthy();
  });

  it("hides program restriction recommendation when program overrides exist", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY_WITH_PROGRAMS);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    expect(screen.queryByTestId("recommendation-add-program-restrictions")).toBeNull();
  });

  it("customer-history source appears when receipt history is available", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    mockFetchReceiptSummary.mockResolvedValue(HISTORY_SUMMARY);

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-history-recent-denials")).toBeTruthy();
    });

    const labels = screen.getAllByTestId("recommendation-source").map((el) => el.textContent);
    expect(labels).toContain("Customer history");
  });

  it("display prioritization keeps more-suggestions collapsed until toggled", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("more-suggestions")).toBeTruthy();
    });

    const toggle = screen.getByTestId("more-suggestions-toggle");
    const list = screen.getByTestId("more-suggestions-list");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(list.className).toContain("hidden");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(list.className).not.toContain("hidden");
  });

  it("hides recommendations section in edit mode via policy-controls button selector", async () => {
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Edit Policy Controls" })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit Policy Controls" }));
    expect(screen.queryByTestId("policy-recommendations")).toBeNull();
  });
});
