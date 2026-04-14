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

export type PolicyMockOpts = {
  plan?: "free" | "pro" | "pro_with_programs";
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
// Telemetry / analytics — silently absorb
// ────────────────────────────────────────────────────────────────────────────

export async function silenceAnalytics(page: Page) {
  await page.route("**/api/events", (route: Route) =>
    route.fulfill({ status: 200, json: { ok: true } }),
  );
}
