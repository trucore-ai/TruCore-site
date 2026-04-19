/**
 * CustomerPoliciesPage — recommendation history panel integration tests.
 *
 * Covers the "What Changed Since Your Last Review" panel that appears when
 * the current recommendation set differs from the snapshot saved in
 * localStorage on the previous visit.
 *
 * MEMORY NOTE: This file uses jsdom + React Testing Library and mounts
 * CustomerPoliciesPage (a large component).  Each worker fork requires
 * ~3–4 GB of heap.  The heap cap is raised to 6 GB via NODE_OPTIONS in
 * .env.test, which Vitest loads automatically.
 * Do not remove .env.test or the worker will OOM at the jsdom setup phase.
 *
 * If these tests OOM on a memory-constrained machine, run them in isolation:
 *   npx vitest run tests/customer-policy-history-panel.test.tsx
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks (must appear before the component import)
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const mockFetchPolicy = vi.fn();
const mockFetchReceiptSummary = vi.fn();
const mockFetchMarketConditions = vi.fn();
const mockFetchPilRecommendations = vi.fn();
const mockFetchCohortBenchmarks = vi.fn();
const mockFetchExternalContext = vi.fn();

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
    updatePolicyOverrides: vi.fn().mockResolvedValue(undefined),
    fetchReceiptSummary: (...args: unknown[]) => mockFetchReceiptSummary(...args),
    fetchMarketConditions: (...args: unknown[]) => mockFetchMarketConditions(...args),
    fetchPilRecommendations: (...args: unknown[]) => mockFetchPilRecommendations(...args),
    fetchCohortBenchmarks: (...args: unknown[]) => mockFetchCohortBenchmarks(...args),
    fetchExternalContext: (...args: unknown[]) => mockFetchExternalContext(...args),
    ApiError,
  };
});

import CustomerPoliciesPage from "@/app/customer/policies/page";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * PRO policy that generates exactly these 3 default recs:
 *   - restrict-tokens  (no token_policy set)
 *   - add-program-restrictions  (no allowed/denied programs)
 *   - customize-policy  (overrides enabled, no overrides set)
 */
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

const EMPTY_HISTORY_SUMMARY = {
  period_days: 30,
  total_receipts: 0,
  decisions: {},
  dry_run_count: 0,
  intent_types: {},
  denial_reasons: [],
  recent_tokens: [],
  recent_programs: [],
  avg_notional_usd: null,
  max_notional_usd: null,
  avg_slippage_bps: null,
  simulation_failures: 0,
  simulation_total: 0,
};

const MARKET_STABLE = {
  environment: "stable" as const,
  rpc_status: "ok",
  throttled_methods: [],
  throttle_rate_pct: 0.0,
  recommendation: null,
  summary: "Execution environment is stable.",
  captured_at: Date.now() / 1000,
  signal_freshness: { status: "fresh" as const, last_updated_at: Date.now() / 1000 },
};

const REC_HISTORY_KEY = "atf_policy_rec_history";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultMocks() {
  mockFetchReceiptSummary.mockResolvedValue(EMPTY_HISTORY_SUMMARY);
  mockFetchMarketConditions.mockResolvedValue(MARKET_STABLE);
  mockFetchPilRecommendations.mockResolvedValue({
    recommendations: [], record_count: 0, confidence_summary: "low",
    captured_at: Date.now() / 1000, plan: "pro",
  });
  mockFetchCohortBenchmarks.mockResolvedValue({
    benchmarks: [], cohort_size: 0, captured_at: Date.now() / 1000, plan: "pro",
  });
  mockFetchExternalContext.mockResolvedValue({
    recommendations: [], captured_at: Date.now() / 1000, plan: "pro",
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe.skip("CustomerPoliciesPage — recommendation history panel (legacy monolith)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    defaultMocks();
  });

  it("does not render history panel on first visit (no prior localStorage entry)", async () => {
    // No history in localStorage — first visit
    localStorage.removeItem(REC_HISTORY_KEY);
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    // First visit suppression: panel must be absent
    expect(screen.queryByTestId("recommendation-history-panel")).toBeNull();
  });

  it("does not render history panel when prior snapshot matches current recs exactly", async () => {
    // Seed with exactly the 3 recs PRO_POLICY generates
    const priorHistory = [
      { id: "restrict-tokens", title: "Restrict token access", source: "Default guidance" },
      { id: "add-program-restrictions", title: "Add program restrictions", source: "Default guidance" },
      { id: "customize-policy", title: "Customize your policy", source: "Default guidance" },
    ];
    localStorage.setItem(REC_HISTORY_KEY, JSON.stringify(priorHistory));
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("policy-recommendations")).toBeTruthy();
    });

    // No changes → panel must be absent
    expect(screen.queryByTestId("recommendation-history-panel")).toBeNull();
  });

  it("renders history panel with Resolved chip when a prior rec is no longer active", async () => {
    // Prior history includes enable-simulation, which PRO_POLICY won't produce
    // (require_simulation_success: true → the rec fires only when it's false)
    const priorHistory = [
      { id: "enable-simulation", title: "Enable simulation requirement", source: "Default guidance" },
      { id: "restrict-tokens", title: "Restrict token access", source: "Default guidance" },
    ];
    localStorage.setItem(REC_HISTORY_KEY, JSON.stringify(priorHistory));
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-history-panel")).toBeTruthy();
    });

    expect(screen.getByText("What Changed Since Your Last Review")).toBeTruthy();

    const resolvedEl = screen.getByTestId("history-resolved-enable-simulation");
    expect(resolvedEl.textContent).toContain("Resolved");
    expect(resolvedEl.textContent).toContain("Enable simulation requirement");
  });

  it("renders history panel with New chip when a rec appears for the first time since a prior visit", async () => {
    // Prior: only restrict-tokens. Now add-program-restrictions and customize-policy are also shown.
    const priorHistory = [
      { id: "restrict-tokens", title: "Restrict token access", source: "Default guidance" },
    ];
    localStorage.setItem(REC_HISTORY_KEY, JSON.stringify(priorHistory));
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-history-panel")).toBeTruthy();
    });

    const newEl = screen.getByTestId("history-new-customize-policy");
    expect(newEl.textContent).toContain("New");
    expect(newEl.textContent).toContain("Customize your policy");
  });

  it("renders both New and Resolved chips when recs were added and removed simultaneously", async () => {
    // Prior: enable-simulation (gone) + restrict-tokens (still active)
    // Current adds: add-program-restrictions + customize-policy (new)
    const priorHistory = [
      { id: "enable-simulation", title: "Enable simulation requirement", source: "Default guidance" },
      { id: "restrict-tokens", title: "Restrict token access", source: "Default guidance" },
    ];
    localStorage.setItem(REC_HISTORY_KEY, JSON.stringify(priorHistory));
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-history-panel")).toBeTruthy();
    });

    // Resolved side
    expect(screen.getByTestId("history-resolved-enable-simulation")).toBeTruthy();
    // New side — at least one of the newly-appearing recs
    const hasNew =
      screen.queryByTestId("history-new-add-program-restrictions") ||
      screen.queryByTestId("history-new-customize-policy");
    expect(hasNew).toBeTruthy();
  });

  it("subtitle says 'resolved since your last visit' when only resolved entries exist", async () => {
    // PRO_POLICY generates: restrict-tokens, add-program-restrictions, customize-policy.
    // Prior history has those 3 PLUS extra-gone → 1 resolved, 0 new.
    const priorHistory = [
      { id: "restrict-tokens", title: "Restrict token access", source: "Default guidance" },
      { id: "add-program-restrictions", title: "Add program restrictions", source: "Default guidance" },
      { id: "customize-policy", title: "Customize your policy", source: "Default guidance" },
      { id: "extra-gone", title: "Some old recommendation", source: "Default guidance" },
    ];
    localStorage.setItem(REC_HISTORY_KEY, JSON.stringify(priorHistory));
    mockFetchPolicy.mockResolvedValue(PRO_POLICY);
    render(<CustomerPoliciesPage />);

    await waitFor(() => {
      expect(screen.getByTestId("recommendation-history-panel")).toBeTruthy();
    });

    // Should use the resolved-only subtitle branch
    expect(screen.getByText(/resolved since your last visit/)).toBeTruthy();
    // Must not use the mixed branch
    expect(screen.queryByText(/\d+ resolved, \d+ new since/)).toBeNull();
  });
});
