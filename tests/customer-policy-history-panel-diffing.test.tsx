import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  CustomerPoliciesPage,
  PRO_POLICY,
  mockFetchPolicy,
  resetPolicyMocks,
} from "./customer-policy-test-harness";

const REC_HISTORY_KEY = "atf_policy_rec_history";

describe.skip("CustomerPoliciesPage — history panel diffing", () => {
  beforeEach(() => {
    resetPolicyMocks();
    localStorage.clear();
  });

  it("shows resolved entries when prior recommendations disappear", async () => {
    localStorage.setItem(
      REC_HISTORY_KEY,
      JSON.stringify([
        { id: "enable-simulation", title: "Enable simulation requirement", source: "Default guidance" },
        { id: "restrict-tokens", title: "Restrict token access", source: "Default guidance" },
      ]),
    );
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-history-panel")).toBeTruthy();
    });

    expect(screen.getByTestId("history-resolved-enable-simulation").textContent).toContain("Resolved");
  });

  it("shows new entries when additional recommendations appear", async () => {
    localStorage.setItem(
      REC_HISTORY_KEY,
      JSON.stringify([{ id: "restrict-tokens", title: "Restrict token access", source: "Default guidance" }]),
    );
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);

    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-history-panel")).toBeTruthy();
    });

    expect(screen.getByTestId("history-new-customize-policy").textContent).toContain("New");
  });
});
