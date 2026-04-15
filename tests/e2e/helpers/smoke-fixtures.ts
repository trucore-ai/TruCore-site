/**
 * Shared test fixtures and helpers for E2E smoke tests.
 *
 * These helpers set up route interception for the ATF backend API so that
 * smoke tests exercise real frontend flows without needing a live backend.
 *
 * ENV vars (see tests/e2e/E2E_STRATEGY.md):
 *   ATF_E2E_API_BASE — Base URL of ATF API to mock routes against.
 *                       Default: https://api.trucore.xyz
 */

import { type Page, type Route } from "@playwright/test";

export const ATF_API =
  process.env.ATF_E2E_API_BASE || "https://api.trucore.xyz";

// ────────────────────────────────────────────────────────────────────────────
// Test users
// ────────────────────────────────────────────────────────────────────────────

let testCounter = 0;

export function uniqueEmail(): string {
  testCounter++;
  return `e2e-smoke-${Date.now()}-${testCounter}@test.trucore.xyz`;
}

export const TEST_PASSWORD = "TestPassword123!";
export const TEST_TOKEN = "e2e-mock-jwt-token";
export const TEST_TENANT_ID = "tenant_e2e_smoke";
export const TEST_API_KEY = "atf_e2e_mock_key_abcdef1234567890";
export const TEST_RESET_TOKEN = "e2e-mock-reset-token-abc123";
export const TEST_VERIFY_TOKEN = "e2e-mock-verify-token-xyz789";

// ────────────────────────────────────────────────────────────────────────────
// Sandbox / Try flow mocks
// ────────────────────────────────────────────────────────────────────────────

const SAMPLE_INTENT = {
  intent: {
    input_mint: "So11111111111111111111111111111111",
    output_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    amount_lamports: 100_000_000,
    slippage_bps: 50,
    protocol: "jupiter",
    action: "swap",
  },
  description: "Swap 0.1 SOL → USDC via Jupiter (sandbox mock)",
  public_sandbox: true,
};

const PROTECT_RESULT = {
  decision: "ALLOW",
  policy_breakdown: [
    { policy: "amount_cap", result: "PASS", reason: "Under daily cap" },
    { policy: "slippage_guard", result: "PASS", reason: "Within 50 bps limit" },
    { policy: "token_allowlist", result: "PASS", reason: "Both tokens on allowlist" },
  ],
  receipt: {
    receipt_id: "rcpt_e2e_sandbox_001",
    timestamp: Math.floor(Date.now() / 1000),
    decision: "ALLOW",
    execution_mode: "dry_run",
    content_hash: "sha256:e2eabcdef1234567890",
    intent_summary: {
      input_mint: "So11111111111111111111111111111111",
      output_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      amount_lamports: 100_000_000,
      protocol: "jupiter",
    },
    protected_by: "ATF v1.0",
    public_sandbox: true,
    mock_note: "E2E test mock receipt",
  },
  public_sandbox: true,
  execution_mode: "dry_run",
};

export async function mockSandboxRoutes(page: Page) {
  await page.route(`${ATF_API}/sandbox/sample-intent`, (route: Route) =>
    route.fulfill({ status: 200, json: SAMPLE_INTENT }),
  );
  await page.route(`${ATF_API}/sandbox/protect`, (route: Route) =>
    route.fulfill({ status: 200, json: PROTECT_RESULT }),
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Auth mocks
// ────────────────────────────────────────────────────────────────────────────

export async function mockAuthRoutes(page: Page, opts?: { emailVerified?: boolean }) {
  const verified = opts?.emailVerified ?? true;

  await page.route(`${ATF_API}/auth/signup`, (route: Route) =>
    route.fulfill({
      status: 200,
      json: {
        token: TEST_TOKEN,
        tenant_id: TEST_TENANT_ID,
        api_key: TEST_API_KEY,
        email_verified: false,
      },
    }),
  );

  await page.route(`${ATF_API}/auth/login`, (route: Route) =>
    route.fulfill({
      status: 200,
      json: {
        token: TEST_TOKEN,
        tenant_id: TEST_TENANT_ID,
        api_key: TEST_API_KEY,
        email_verified: verified,
      },
    }),
  );

  await page.route(`${ATF_API}/auth/verify-email/request`, (route: Route) =>
    route.fulfill({ status: 200, json: { status: "sent" } }),
  );

  await page.route(`${ATF_API}/auth/verify-email/confirm`, (route: Route) =>
    route.fulfill({ status: 200, json: { status: "verified", email: "e2e@test.trucore.xyz" } }),
  );

  await page.route(`${ATF_API}/auth/verify-email/status`, (route: Route) =>
    route.fulfill({
      status: 200,
      json: {
        email: "e2e@test.trucore.xyz",
        email_verified: verified,
        email_verified_at: verified ? Math.floor(Date.now() / 1000) : null,
        verification_pending: !verified,
      },
    }),
  );

  await page.route(`${ATF_API}/auth/password-reset/request`, (route: Route) =>
    route.fulfill({
      status: 200,
      json: { status: "sent", message: "If account exists, reset link sent." },
    }),
  );

  await page.route(`${ATF_API}/auth/password-reset/validate`, (route: Route) =>
    route.fulfill({ status: 200, json: { valid: true } }),
  );

  await page.route(`${ATF_API}/auth/password-reset/confirm`, (route: Route) =>
    route.fulfill({
      status: 200,
      json: { status: "reset", message: "Password updated." },
    }),
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Dashboard / onboarding mocks
// ────────────────────────────────────────────────────────────────────────────

export async function mockDashboardRoutes(page: Page) {
  await page.route(`${ATF_API}/dashboard/me`, (route: Route) =>
    route.fulfill({
      status: 200,
      json: {
        user_id: "usr_e2e_001",
        email: "e2e@test.trucore.xyz",
        email_verified: true,
        tenant_id: TEST_TENANT_ID,
        tenant: { plan_tier: "free", status: "active" },
        api_keys: [
          {
            key_id: "key_e2e_001",
            label: "e2e-test-key",
            status: "active",
            created_at: Math.floor(Date.now() / 1000) - 3600,
          },
        ],
        receipt_count: 3,
      },
    }),
  );

  await page.route(`${ATF_API}/dashboard/activation`, (route: Route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 200,
        json: {
          onboarding_completed: false,
          steps_completed: ["sample_generated"],
          first_receipt_id: null,
        },
      });
    }
    return route.fulfill({
      status: 200,
      json: {
        onboarding_completed: false,
        steps_completed: [],
        first_receipt_id: null,
      },
    });
  });

  await page.route(`${ATF_API}/onboarding/sample-intent`, (route: Route) =>
    route.fulfill({ status: 200, json: SAMPLE_INTENT }),
  );

  await page.route(`${ATF_API}/onboarding/protect-dry-run`, (route: Route) =>
    route.fulfill({ status: 200, json: PROTECT_RESULT }),
  );

  await page.route(`${ATF_API}/onboarding/execute-sample`, (route: Route) =>
    route.fulfill({
      status: 200,
      json: {
        ...PROTECT_RESULT,
        execution_mode: "mock",
        receipt: {
          ...PROTECT_RESULT.receipt,
          receipt_id: "rcpt_e2e_onboard_exec_001",
          execution_mode: "mock",
        },
      },
    }),
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Receipts mocks
// ────────────────────────────────────────────────────────────────────────────

const MOCK_RECEIPTS = [
  {
    receipt_id: "rcpt_e2e_001",
    created_at: Math.floor(Date.now() / 1000) - 3600,
    decision: "ALLOW",
    dry_run: false,
    content_hash: "sha256:aabbccdd11223344",
    protected_by: "ATF v1.0",
    summary: "Swap 0.5 SOL → USDC",
    intent_type: "swap",
  },
  {
    receipt_id: "rcpt_e2e_002",
    created_at: Math.floor(Date.now() / 1000) - 7200,
    decision: "ALLOW",
    dry_run: true,
    content_hash: "sha256:eeff00112233",
    protected_by: "ATF v1.0",
    summary: "Swap 1.0 SOL → BONK (dry run)",
    intent_type: "swap",
  },
];

export async function mockReceiptRoutes(page: Page) {
  await page.route(`${ATF_API}/customer/receipts`, (route: Route) => {
    if (route.request().method() === "POST") {
      // verify endpoint
      return route.fulfill({
        status: 200,
        json: { verified: true, valid: true, matches: true },
      });
    }
    return route.fulfill({
      status: 200,
      json: { receipts: MOCK_RECEIPTS, count: MOCK_RECEIPTS.length },
    });
  });

  await page.route(`${ATF_API}/customer/receipts/verify`, (route: Route) =>
    route.fulfill({
      status: 200,
      json: { verified: true, valid: true, matches: true },
    }),
  );

  await page.route(`${ATF_API}/customer/receipts/rcpt_e2e_*`, (route: Route) =>
    route.fulfill({
      status: 200,
      json: {
        ...MOCK_RECEIPTS[0],
        policy_breakdown: [
          { policy: "amount_cap", result: "PASS", reason: "Under daily cap" },
          { policy: "slippage_guard", result: "PASS", reason: "Within limit" },
        ],
        metadata: { version: "1.0", issuer: "atf-firewall" },
        full_receipt: { ...MOCK_RECEIPTS[0], raw: "full-receipt-json" },
      },
    }),
  );
}

// ────────────────────────────────────────────────────────────────────────────
// API keys mocks
// ────────────────────────────────────────────────────────────────────────────

let keyCounter = 0;

export async function mockKeyRoutes(page: Page) {
  const keys = [
    {
      key_id: "key_e2e_001",
      label: "production-bot",
      status: "active",
      created_at: Math.floor(Date.now() / 1000) - 86400,
      last_used_at: Math.floor(Date.now() / 1000) - 600,
      preview: "atf_****7890",
    },
  ];

  await page.route(`${ATF_API}/customer/keys`, (route: Route) => {
    if (route.request().method() === "POST") {
      keyCounter++;
      return route.fulfill({
        status: 200,
        json: {
          key_id: `key_e2e_new_${keyCounter}`,
          label: "e2e-created-key",
          status: "active",
          created_at: Math.floor(Date.now() / 1000),
          last_used_at: null,
          preview: "atf_****e2e0",
          raw_secret: `atf_e2e_raw_secret_${keyCounter}_do_not_share`,
        },
      });
    }
    return route.fulfill({ status: 200, json: { keys, count: keys.length } });
  });

  await page.route(`${ATF_API}/customer/keys/*/revoke`, (route: Route) =>
    route.fulfill({ status: 200, json: { status: "revoked" } }),
  );

  await page.route(`${ATF_API}/customer/keys/*/rotate`, (route: Route) => {
    keyCounter++;
    return route.fulfill({
      status: 200,
      json: {
        key_id: `key_e2e_rot_${keyCounter}`,
        label: "production-bot",
        status: "active",
        created_at: Math.floor(Date.now() / 1000),
        last_used_at: null,
        preview: "atf_****rot0",
        raw_secret: `atf_e2e_rotated_secret_${keyCounter}`,
        rotated_from: "key_e2e_001",
      },
    });
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Admin user ops mocks
// ────────────────────────────────────────────────────────────────────────────

export async function mockAdminUserRoutes(page: Page) {
  // The admin users page calls fetchAdminUsers() server-side, which goes to
  // the ATF backend. We intercept at the page level.
  await page.route(`${ATF_API}/admin/users*`, (route: Route) =>
    route.fulfill({
      status: 200,
      json: {
        users: [
          {
            user_id: "usr_e2e_target",
            email: "target@test.trucore.xyz",
            email_verified: false,
            created_at: Math.floor(Date.now() / 1000) - 86400,
            tenant_id: "tenant_e2e_target",
            last_verification_sent: null,
            last_reset_sent: null,
          },
        ],
        count: 1,
      },
    }),
  );

  await page.route(`${ATF_API}/admin/users/*/resend-verification`, (route: Route) =>
    route.fulfill({ status: 200, json: { status: "sent" } }),
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Auth injection helper (set localStorage as if logged in)
// ────────────────────────────────────────────────────────────────────────────

export async function injectCustomerAuth(page: Page) {
  await page.addInitScript(
    ({ token, tenantId, apiKey }) => {
      localStorage.setItem("atf_customer_token", token);
      localStorage.setItem("atf_customer_tenant", tenantId);
      localStorage.setItem("atf_customer_api_key", apiKey);
    },
    { token: TEST_TOKEN, tenantId: TEST_TENANT_ID, apiKey: TEST_API_KEY },
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Policy mocks
// ────────────────────────────────────────────────────────────────────────────

const FREE_POLICY = {
  plan_code: "free",
  plan_limits: {
    tx_limit_per_month: 50,
    policy_overrides_enabled: false,
    max_notional_usd: 1000,
    max_slippage_bps: 300,
    require_simulation_success: true,
  },
  overrides: {},
  effective: {
    tx_limit_per_month: 50,
    max_notional_usd: 1000,
    max_slippage_bps: 300,
    require_simulation_success: true,
  },
};

const PRO_POLICY = {
  plan_code: "pro",
  plan_limits: {
    tx_limit_per_month: 5000,
    policy_overrides_enabled: true,
    max_notional_usd: 25000,
    max_value_sol: 1000,
    max_slippage_bps: 500,
    require_simulation_success: true,
  },
  overrides: {
    max_slippage_bps: 200,
  },
  effective: {
    tx_limit_per_month: 5000,
    max_notional_usd: 25000,
    max_value_sol: 1000,
    max_slippage_bps: 200,
    require_simulation_success: true,
  },
};

const PRO_POLICY_WITH_PROGRAMS = {
  ...PRO_POLICY,
  overrides: {
    max_slippage_bps: 200,
    allowed_programs: ["11111111111111111111111111111111"],
    denied_programs: ["DEaDBeeF11111111111111111111111111111111111111"],
  },
  effective: {
    ...PRO_POLICY.effective,
    allowed_programs: ["11111111111111111111111111111111"],
    denied_programs: ["DEaDBeeF11111111111111111111111111111111111111"],
  },
};

const PRO_POLICY_WITH_TOKEN_POLICY = {
  ...PRO_POLICY,
  overrides: {
    max_slippage_bps: 200,
    token_policy: {
      mode: "allowlist",
      allowed_mints: ["SOL", "USDC"],
      denied_mints: [],
    },
  },
  effective: {
    ...PRO_POLICY.effective,
    token_policy: {
      mode: "allowlist",
      allowed_mints: ["SOL", "USDC"],
      denied_mints: [],
    },
  },
};

export type PolicyMockOpts = {
  plan?: PolicyMockPlan;
  patchStatus?: number;
  patchBody?: Record<string, unknown>;
};

export async function mockPolicyRoutes(page: Page, opts?: PolicyMockOpts) {
  const plan = opts?.plan ?? "pro";

  const policyData =
    plan === "free"
      ? FREE_POLICY
      : plan === "pro_with_programs"
        ? PRO_POLICY_WITH_PROGRAMS
        : plan === "pro_with_token_policy"
          ? PRO_POLICY_WITH_TOKEN_POLICY
          : plan === "advanced"
            ? ADVANCED_POLICY
            : plan === "enterprise"
              ? ENTERPRISE_POLICY
              : PRO_POLICY;

  // Intercept GET /api/customer/policy (same-origin proxy)
  let currentPolicy = { ...policyData };

  await page.route("**/api/customer/policy", (route: Route) => {
    if (route.request().url().includes("/overrides")) return route.fallback();
    return route.fulfill({ status: 200, json: currentPolicy });
  });

  // Intercept PATCH /api/customer/policy/overrides (same-origin proxy)
  const patchStatus = opts?.patchStatus ?? 200;
  const patchBody = opts?.patchBody;

  await page.route("**/api/customer/policy/overrides", (route: Route) => {
    if (patchStatus !== 200) {
      return route.fulfill({ status: patchStatus, json: patchBody ?? {} });
    }

    // Parse the request body and update currentPolicy to simulate a save
    const body = route.request().postDataJSON();
    const newOverrides = body?.overrides ?? {};
    currentPolicy = {
      ...currentPolicy,
      overrides: newOverrides,
      effective: { ...currentPolicy.effective, ...newOverrides },
    };

    return route.fulfill({
      status: 200,
      json: { overrides: newOverrides, message: "Policy overrides updated." },
    });
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Receipt summary mocks (history-aware recommendations)
// ────────────────────────────────────────────────────────────────────────────

/** Rich history summary — triggers multiple recommendation types. */
export const RICH_HISTORY_SUMMARY = {
  period_days: 30,
  total_receipts: 42,
  decisions: { allow: 38, deny: 4 },
  dry_run_count: 5,
  intent_types: { swap: 30, multi_hop_swap: 8, lend: 4 },
  denial_reasons: ["slippage_exceeded", "notional_limit"],
  recent_tokens: ["SOL", "USDC", "BONK"],
  recent_programs: ["JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"],
  avg_notional_usd: 2500,
  max_notional_usd: 18000,
  avg_slippage_bps: 55,
  simulation_failures: 3,
  simulation_total: 40,
};

/** Empty history summary — new customer with no receipts. */
export const EMPTY_HISTORY_SUMMARY = {
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

export type ReceiptSummaryMockOpts = {
  /** Provide a custom summary object, or "empty" / "rich" shortcuts. */
  variant?: "rich" | "empty" | Record<string, unknown>;
  /** HTTP status to return (default 200). */
  status?: number;
};

export async function mockReceiptSummaryRoute(
  page: Page,
  opts?: ReceiptSummaryMockOpts,
) {
  const variant = opts?.variant ?? "empty";
  const status = opts?.status ?? 200;
  const body =
    variant === "rich"
      ? RICH_HISTORY_SUMMARY
      : variant === "empty"
        ? EMPTY_HISTORY_SUMMARY
        : variant;

  await page.route("**/api/customer/receipts/summary*", (route: Route) =>
    route.fulfill({ status, json: body }),
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Market conditions mocks (market-aware recommendations)
// ────────────────────────────────────────────────────────────────────────────

/** Stable — no infrastructure issues detected.  No market recs generated. */
export const MARKET_STABLE = {
  environment: "stable",
  rpc_status: "ok",
  throttled_methods: [] as string[],
  throttle_rate_pct: 0.0,
  recommendation: null,
  summary: "Execution environment is stable — no infrastructure issues detected.",
  captured_at: Math.floor(Date.now() / 1000),
  signal_freshness: { status: "fresh", last_updated_at: Math.floor(Date.now() / 1000) },
};

/** Degraded — minor throttling, non-critical methods only. */
export const MARKET_DEGRADED = {
  environment: "degraded",
  rpc_status: "degraded",
  throttled_methods: ["getLatestBlockhash"],
  throttle_rate_pct: 2.5,
  recommendation: "increase_backoff",
  summary:
    "Execution environment shows minor degradation — 2.5% of requests are being throttled.",
  captured_at: Math.floor(Date.now() / 1000),
  signal_freshness: { status: "fresh", last_updated_at: Math.floor(Date.now() / 1000) },
};

/** Stressed — high throttle rate, including sendTransaction. */
export const MARKET_STRESSED = {
  environment: "stressed",
  rpc_status: "throttled",
  throttled_methods: ["getLatestBlockhash", "sendTransaction", "getBalance"],
  throttle_rate_pct: 14.8,
  recommendation: "upgrade_plan",
  summary:
    "Execution environment is under stress — getLatestBlockhash, sendTransaction, getBalance experiencing elevated throttling (14.8% error rate).",
  captured_at: Math.floor(Date.now() / 1000),
  signal_freshness: { status: "fresh", last_updated_at: Math.floor(Date.now() / 1000) },
};

/** Stale market conditions — data exists but signal is outdated. */
export const MARKET_STALE = {
  ...MARKET_DEGRADED,
  signal_freshness: { status: "stale", last_updated_at: Math.floor(Date.now() / 1000) - 600 },
};

/** Unavailable market conditions — no signal data ever recorded. */
export const MARKET_UNAVAILABLE = {
  environment: "unknown",
  rpc_status: "unknown",
  throttled_methods: [] as string[],
  throttle_rate_pct: 0.0,
  recommendation: null,
  summary: "Signal data is unavailable.",
  captured_at: null,
  signal_freshness: { status: "unavailable", last_updated_at: null },
};

export type MarketConditionsMockOpts = {
  /** "stable", "degraded", "stressed", "stale", "unavailable", or a custom object. */
  variant?: "stable" | "degraded" | "stressed" | "stale" | "unavailable" | Record<string, unknown>;
  /** HTTP status to return (default 200). */
  status?: number;
};

export async function mockMarketConditionsRoute(
  page: Page,
  opts?: MarketConditionsMockOpts,
) {
  const variant = opts?.variant ?? "stable";
  const status = opts?.status ?? 200;
  const body =
    variant === "stable"
      ? MARKET_STABLE
      : variant === "degraded"
        ? MARKET_DEGRADED
        : variant === "stressed"
          ? MARKET_STRESSED
          : variant === "stale"
            ? MARKET_STALE
            : variant === "unavailable"
              ? MARKET_UNAVAILABLE
              : variant;

  await page.route("**/api/customer/market-conditions*", (route: Route) =>
    route.fulfill({ status, json: body }),
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PIL recommendations mocks (Policy Intelligence source)
// ────────────────────────────────────────────────────────────────────────────

/** PIL with actionable recommendations (stable confidence). */
export const PIL_WITH_RECS = {
  recommendations: [
    {
      id: "REDUCE_SLIPPAGE",
      title: "Reduce slippage tolerance",
      explanation:
        "Slippage pressure is high — many transactions are near the configured threshold.",
      parameter: "max_slippage_bps",
      confidence: "high",
      evidence: "avg_slippage=95bps, near_threshold=8/42",
    },
    {
      id: "HIGH_FRICTION",
      title: "Policy friction is elevated",
      explanation: "Denial rate is 12/42. Review policy rules.",
      parameter: "max_notional_usd",
      confidence: "medium",
      evidence: "denial_rate=28.6%, near_boundary=4",
    },
    {
      id: "GENERAL_HEALTH",
      title: "System health is acceptable",
      explanation: "Overall pulse score is 0.72 (stable). No urgent changes needed.",
      parameter: "none",
      confidence: "high",
      evidence: "overall_label=stable",
    },
  ],
  record_count: 42,
  confidence_summary: "medium",
  captured_at: Math.floor(Date.now() / 1000),
  plan: "pro",
  gated: false,
  gated_count: 0,
};

/** PIL with zero recommendations (sparse data, new customer). */
export const PIL_EMPTY = {
  recommendations: [] as unknown[],
  record_count: 0,
  confidence_summary: "low",
  captured_at: Math.floor(Date.now() / 1000),
  plan: "free",
  gated: false,
  gated_count: 0,
};

/** PIL gated response for Free-tier users (recommendations withheld). */
export const PIL_GATED = {
  recommendations: [] as unknown[],
  record_count: 42,
  confidence_summary: "medium",
  captured_at: Math.floor(Date.now() / 1000),
  plan: "free",
  gated: true,
  gated_count: 3,
};

export type PilRecommendationsMockOpts = {
  /** "with-recs", "empty", "gated", or a custom object. */
  variant?: "with-recs" | "empty" | "gated" | Record<string, unknown>;
  /** HTTP status to return (default 200). */
  status?: number;
};

export async function mockPilRecommendationsRoute(
  page: Page,
  opts?: PilRecommendationsMockOpts,
) {
  const variant = opts?.variant ?? "empty";
  const status = opts?.status ?? 200;
  const body =
    variant === "with-recs"
      ? PIL_WITH_RECS
      : variant === "gated"
        ? PIL_GATED
        : variant === "empty"
          ? PIL_EMPTY
          : variant;

  await page.route("**/api/customer/intel/recommendations*", (route: Route) =>
    route.fulfill({ status, json: body }),
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Cohort benchmark mocks (Cohort benchmark source)
// ────────────────────────────────────────────────────────────────────────────

/** Full benchmark response — Advanced+ callers see benchmark bodies. */
export const COHORT_BENCHMARKS_FULL = {
  benchmarks: [
    {
      id: "COHORT_SLIPPAGE_LOOSE",
      title: "Slippage tolerance is wider than most",
      explanation:
        "Your slippage cap is notably higher than what similar configurations typically use. Consider tightening it to reduce unfavorable execution risk.",
      parameter: "max_slippage_bps",
      confidence: "medium",
      evidence: "Based on aggregated data from 47 similar recent configurations.",
    },
    {
      id: "COHORT_USD_LIMIT_HIGH",
      title: "Transaction limit is higher than typical",
      explanation:
        "Your per-transaction USD limit is significantly higher than what comparable configurations use. Review whether this headroom is intentional.",
      parameter: "max_notional_usd",
      confidence: "medium",
      evidence: "Based on aggregated data from 47 similar recent configurations.",
    },
  ],
  cohort_size: 47,
  captured_at: Math.floor(Date.now() / 1000),
  plan: "advanced",
  gated: false,
  gated_count: 0,
};

/** Empty benchmark response — no benchmarks produced (cohort too small or values match). */
export const COHORT_BENCHMARKS_EMPTY = {
  benchmarks: [] as unknown[],
  cohort_size: 3,
  captured_at: Math.floor(Date.now() / 1000),
  plan: "advanced",
  gated: false,
  gated_count: 0,
};

/** Gated benchmark response — Free/Pro callers see count but no bodies. */
export const COHORT_BENCHMARKS_GATED = {
  benchmarks: [] as unknown[],
  cohort_size: 47,
  captured_at: Math.floor(Date.now() / 1000),
  plan: "free",
  gated: true,
  gated_count: 2,
};

export type CohortBenchmarksMockOpts = {
  /** "full", "empty", "gated", or a custom object. */
  variant?: "full" | "empty" | "gated" | Record<string, unknown>;
  /** HTTP status to return (default 200). */
  status?: number;
};

export async function mockCohortBenchmarksRoute(
  page: Page,
  opts?: CohortBenchmarksMockOpts,
) {
  const variant = opts?.variant ?? "empty";
  const status = opts?.status ?? 200;
  const body =
    variant === "full"
      ? COHORT_BENCHMARKS_FULL
      : variant === "gated"
        ? COHORT_BENCHMARKS_GATED
        : variant === "empty"
          ? COHORT_BENCHMARKS_EMPTY
          : variant;

  await page.route("**/api/customer/intel/benchmarks*", (route: Route) =>
    route.fulfill({ status, json: body }),
  );
}

// ────────────────────────────────────────────────────────────────────────────
// External context mocks (External context source — Enterprise only)
// ────────────────────────────────────────────────────────────────────────────

/** Full external context response — Enterprise callers see recommendation bodies. */
export const EXTERNAL_CONTEXT_FULL = {
  recommendations: [
    {
      id: "EXT_SUSTAINED_THROTTLE",
      title: "Sustained external network pressure detected",
      explanation:
        "The execution environment has been experiencing sustained throttling for multiple consecutive minutes. Consider enabling simulation requirements and tightening slippage.",
      parameter: "require_simulation_success",
      confidence: "high",
      evidence: "External infrastructure has been under sustained pressure for 6 consecutive minutes.",
    },
    {
      id: "EXT_HIGH_THROTTLE_RATE",
      title: "Elevated external infrastructure error rate",
      explanation:
        "The shared execution infrastructure is experiencing an elevated error rate. Consider reducing transaction size limits temporarily.",
      parameter: "max_notional_usd",
      confidence: "medium",
      evidence: "External infrastructure error rate is 11.0%, above the normal operating threshold.",
    },
  ],
  captured_at: Math.floor(Date.now() / 1000),
  plan: "enterprise",
  gated: false,
  gated_count: 0,
  signal_freshness: { status: "fresh", last_updated_at: Math.floor(Date.now() / 1000) },
};

/** Empty external context response — environment is healthy, no recommendations. */
export const EXTERNAL_CONTEXT_EMPTY = {
  recommendations: [] as unknown[],
  captured_at: Math.floor(Date.now() / 1000),
  plan: "enterprise",
  gated: false,
  gated_count: 0,
  signal_freshness: { status: "fresh", last_updated_at: Math.floor(Date.now() / 1000) },
};

/** Gated external context response — below-Enterprise callers see count but no bodies. */
export const EXTERNAL_CONTEXT_GATED = {
  recommendations: [] as unknown[],
  captured_at: Math.floor(Date.now() / 1000),
  plan: "advanced",
  gated: true,
  gated_count: 2,
  signal_freshness: { status: "fresh", last_updated_at: Math.floor(Date.now() / 1000) },
};

/** Stale external context — signal data is outdated, recommendations withheld (empty). */
export const EXTERNAL_CONTEXT_STALE = {
  recommendations: [] as unknown[],
  captured_at: Math.floor(Date.now() / 1000) - 600,
  plan: "enterprise",
  gated: false,
  gated_count: 0,
  signal_freshness: { status: "stale", last_updated_at: Math.floor(Date.now() / 1000) - 600 },
};

/** Unavailable external context — no signal data ever recorded. */
export const EXTERNAL_CONTEXT_UNAVAILABLE = {
  recommendations: [] as unknown[],
  captured_at: null,
  plan: "enterprise",
  gated: false,
  gated_count: 0,
  signal_freshness: { status: "unavailable", last_updated_at: null },
};

export type ExternalContextMockOpts = {
  /** "full", "empty", "gated", "stale", "unavailable", or a custom object. */
  variant?: "full" | "empty" | "gated" | "stale" | "unavailable" | Record<string, unknown>;
  /** HTTP status to return (default 200). */
  status?: number;
};

export async function mockExternalContextRoute(
  page: Page,
  opts?: ExternalContextMockOpts,
) {
  const variant = opts?.variant ?? "empty";
  const status = opts?.status ?? 200;
  const body =
    variant === "full"
      ? EXTERNAL_CONTEXT_FULL
      : variant === "gated"
        ? EXTERNAL_CONTEXT_GATED
        : variant === "empty"
          ? EXTERNAL_CONTEXT_EMPTY
          : variant === "stale"
            ? EXTERNAL_CONTEXT_STALE
            : variant === "unavailable"
              ? EXTERNAL_CONTEXT_UNAVAILABLE
              : variant;

  await page.route("**/api/customer/intel/external-context*", (route: Route) =>
    route.fulfill({ status, json: body }),
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Advanced / Enterprise policy mocks (for benchmark-eligible tiers)
// ────────────────────────────────────────────────────────────────────────────

const ADVANCED_POLICY = {
  plan_code: "advanced",
  plan_limits: {
    tx_limit_per_month: 25000,
    policy_overrides_enabled: true,
    max_notional_usd: 100000,
    max_value_sol: 5000,
    max_slippage_bps: 1000,
    require_simulation_success: true,
  },
  overrides: {
    max_slippage_bps: 300,
  },
  effective: {
    tx_limit_per_month: 25000,
    max_notional_usd: 100000,
    max_value_sol: 5000,
    max_slippage_bps: 300,
    require_simulation_success: true,
  },
};

const ENTERPRISE_POLICY = {
  plan_code: "enterprise",
  plan_limits: {
    tx_limit_per_month: 100000,
    policy_overrides_enabled: true,
    max_notional_usd: 500000,
    max_value_sol: 25000,
    max_slippage_bps: 2000,
    require_simulation_success: true,
  },
  overrides: {
    max_slippage_bps: 500,
  },
  effective: {
    tx_limit_per_month: 100000,
    max_notional_usd: 500000,
    max_value_sol: 25000,
    max_slippage_bps: 500,
    require_simulation_success: true,
  },
};

export type PolicyMockPlan =
  | "free"
  | "pro"
  | "pro_with_programs"
  | "pro_with_token_policy"
  | "advanced"
  | "enterprise";

// ────────────────────────────────────────────────────────────────────────────
// Telemetry / analytics — silently absorb
// ────────────────────────────────────────────────────────────────────────────

export async function silenceAnalytics(page: Page) {
  await page.route("**/api/events", (route: Route) =>
    route.fulfill({ status: 200, json: { ok: true } }),
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Convenience: mock all intel routes with safe empty defaults
// ────────────────────────────────────────────────────────────────────────────

/**
 * Mock all intel-backed routes with safe empty/stable defaults.
 * Call this in any describe block that does not explicitly test those sources
 * so that unmocked routes never hit the real proxy (avoids timing noise and
 * 404 log spam from the dev server).
 *
 * Covers: market-conditions (stable), PIL (empty), cohort (empty), external (empty).
 * Blocks that explicitly test a specific source can override individual routes
 * after calling this helper — later page.route() calls replace earlier ones.
 */
export async function mockEmptyIntelRoutes(page: Page) {
  await mockMarketConditionsRoute(page, { variant: "stable" });
  await mockPilRecommendationsRoute(page, { variant: "empty" });
  await mockCohortBenchmarksRoute(page, { variant: "empty" });
  await mockExternalContextRoute(page, { variant: "empty" });
}

/**
 * Mock all intel-backed routes with "fully loaded" data-producing variants.
 * Use in coexistence tests to light up all recommendation sources at once.
 *
 * Covers: rich history, stressed market, PIL with-recs, full cohort, full external.
 */
export async function mockAllIntelSourcesLoaded(page: Page) {
  await mockReceiptSummaryRoute(page, { variant: "rich" });
  await mockMarketConditionsRoute(page, { variant: "stressed" });
  await mockPilRecommendationsRoute(page, { variant: "with-recs" });
  await mockCohortBenchmarksRoute(page, { variant: "full" });
  await mockExternalContextRoute(page, { variant: "full" });
}
