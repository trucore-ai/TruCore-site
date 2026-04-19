import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  CustomerPoliciesPage,
  PRO_POLICY,
  mockFetchPolicy,
  resetPolicyMocks,
} from "./customer-policy-test-harness";

const REC_HISTORY_KEY = "atf_policy_rec_history";

describe.skip("CustomerPoliciesPage — history panel render rules", () => {
  beforeEach(() => {
    resetPolicyMocks();
    localStorage.clear();
  });

  it("does not render history panel on first visit", async () => {
    localStorage.removeItem(REC_HISTORY_KEY);
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    expect(screen.queryByTestId("recommendation-history-panel")).toBeNull();
  });

  it("does not render history panel when snapshot matches current recs", async () => {
    localStorage.setItem(
      REC_HISTORY_KEY,
      JSON.stringify([
        { id: "restrict-tokens", title: "Restrict token access", source: "Default guidance" },
        { id: "add-program-restrictions", title: "Add program restrictions", source: "Default guidance" },
        { id: "customize-policy", title: "Customize your policy", source: "Default guidance" },
      ]),
    );
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    expect(screen.queryByTestId("recommendation-history-panel")).toBeNull();
  });
});
