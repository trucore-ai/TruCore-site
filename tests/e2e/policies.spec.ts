import { expect, test } from "@playwright/test";
import {
  mockAuthRoutes,
  mockDashboardRoutes,
  mockPolicyRoutes,
  mockReceiptSummaryRoute,
  mockMarketConditionsRoute,
  mockPilRecommendationsRoute,
  mockCohortBenchmarksRoute,
  mockExternalContextRoute,
  injectCustomerAuth,
  silenceAnalytics,
  RICH_HISTORY_SUMMARY,
  MARKET_STRESSED,
  MARKET_STALE,
  MARKET_UNAVAILABLE,
  EXTERNAL_CONTEXT_STALE,
  EXTERNAL_CONTEXT_UNAVAILABLE,
} from "./helpers/smoke-fixtures";

/**
 * Customer policy editing E2E tests.
 *
 * Covers: plan-gated read-only vs editable states, numeric + boolean + list
 * field editing, save/cancel, success/failure banners, and program list
 * add/remove interactions.
 */

// ────────────────────────────────────────────────────────────────────────────
// Free plan — read-only
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — free plan (read-only)", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "free" });
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("free user sees policy page without edit controls", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(
      page.getByRole("heading", { name: "Policy & Protections" }),
    ).toBeVisible();

    // Plan badge should show Free tier
    await expect(
      page.locator("span.capitalize").filter({ hasText: /^Free$/ }),
    ).toBeVisible();

    // Overrides not available
    await expect(page.getByText("Not available on this plan")).toBeVisible();

    // No Edit button should be present
    await expect(
      page.getByRole("button", { name: "Edit Overrides" }),
    ).not.toBeVisible();

    // Footer upgrade hint
    await expect(
      page.getByText("Policy customization is available on Pro plans and above"),
    ).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Pro plan — editable overrides
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — pro plan editing", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("pro user sees Edit Overrides button", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(
      page.getByRole("heading", { name: "Policy & Protections" }),
    ).toBeVisible();

    // Plan badge should show Pro tier
    await expect(
      page.locator("span.capitalize").filter({ hasText: /^Pro$/ }),
    ).toBeVisible();

    // Overrides enabled indicator
    await expect(
      page.locator("span").filter({ hasText: /^Enabled$/ }),
    ).toBeVisible();

    // Edit button present
    await expect(
      page.getByRole("button", { name: "Edit Overrides" }),
    ).toBeVisible();
  });

  test("pro user can enter edit mode", async ({ page }) => {
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();

    // Form fields should be visible
    await expect(page.getByLabel("Max Slippage (bps)")).toBeVisible();
    await expect(page.getByLabel("Max Transaction Value (USD)")).toBeVisible();
    await expect(page.getByLabel("Max Value (SOL)")).toBeVisible();
    await expect(page.getByLabel("Require Simulation Success")).toBeVisible();
    await expect(page.getByLabel("Allowed Programs")).toBeVisible();
    await expect(page.getByLabel("Denied Programs")).toBeVisible();

    // Save and Cancel buttons should be visible
    await expect(
      page.getByRole("button", { name: "Save Overrides" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Cancel" }),
    ).toBeVisible();

    // Existing override should be pre-populated
    await expect(page.getByLabel("Max Slippage (bps)")).toHaveValue("200");
  });

  test("pro user can edit numeric field and save", async ({ page }) => {
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();

    // Change max slippage
    const slippageInput = page.getByLabel("Max Slippage (bps)");
    await slippageInput.fill("150");

    // Fill a new field
    const solInput = page.getByLabel("Max Value (SOL)");
    await solInput.fill("500");

    await page.getByRole("button", { name: "Save Overrides" }).click();

    // Should exit edit mode and show success banner
    await expect(
      page.getByText("Policy overrides saved successfully"),
    ).toBeVisible();

    // Edit button should reappear (not in edit mode)
    await expect(
      page.getByRole("button", { name: "Edit Overrides" }),
    ).toBeVisible();
  });

  test("cancel exits edit mode without saving", async ({ page }) => {
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();

    // Change a value
    await page.getByLabel("Max Slippage (bps)").fill("999");

    // Cancel
    await page.getByRole("button", { name: "Cancel" }).click();

    // Should exit edit mode
    await expect(
      page.getByRole("button", { name: "Edit Overrides" }),
    ).toBeVisible();

    // No success banner
    await expect(
      page.getByText("Policy overrides saved successfully"),
    ).not.toBeVisible();

    // Re-enter edit mode — value should be original (200), not 999
    await page.getByRole("button", { name: "Edit Overrides" }).click();
    await expect(page.getByLabel("Max Slippage (bps)")).toHaveValue("200");
  });

  test("successful save refreshes displayed state", async ({ page }) => {
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();
    await page.getByLabel("Max Slippage (bps)").fill("100");
    await page.getByRole("button", { name: "Save Overrides" }).click();

    await expect(
      page.getByText("Policy overrides saved successfully"),
    ).toBeVisible();

    // The overrides section should now show the updated value
    // Re-enter edit mode to verify persisted value
    await page.getByRole("button", { name: "Edit Overrides" }).click();
    await expect(page.getByLabel("Max Slippage (bps)")).toHaveValue("100");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Pro plan — list editor interactions
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — program list editors", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "pro_with_programs" });
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("pre-populates program lists from existing overrides", async ({ page }) => {
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();

    // Existing allowed_programs entry should appear as a chip
    await expect(
      page.getByText("11111111111111111111111111111111").first(),
    ).toBeVisible();

    // Existing denied_programs entry should appear as a chip
    await expect(
      page.getByText("DEaDBeeF11111111111111111111111111111111111111").first(),
    ).toBeVisible();
  });

  test("add allowed_programs entry via Enter and save", async ({ page }) => {
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();

    // Type a new program ID into the allowed_programs input and press Enter
    const allowedInput = page.locator("#override-allowed_programs");
    await allowedInput.fill("NewProgram111111111111111111111");
    await allowedInput.press("Enter");

    // New chip should appear
    await expect(
      page.getByText("NewProgram111111111111111111111"),
    ).toBeVisible();

    // Save
    await page.getByRole("button", { name: "Save Overrides" }).click();

    await expect(
      page.getByText("Policy overrides saved successfully"),
    ).toBeVisible();
  });

  test("add allowed_programs entry via Add button", async ({ page }) => {
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();

    const allowedInput = page.locator("#override-allowed_programs");
    await allowedInput.fill("ViaButtonProgram1111111111111111");

    // Click the Add button adjacent to the input
    // There are multiple Add buttons (one per list field); use the first one
    const addButtons = page.getByRole("button", { name: "Add" });
    await addButtons.first().click();

    await expect(
      page.getByText("ViaButtonProgram1111111111111111"),
    ).toBeVisible();
  });

  test("remove denied_programs entry via x button", async ({ page }) => {
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();

    // The denied_programs entry should have a remove button
    const removeBtn = page.getByRole("button", {
      name: /Remove DEaDBeeF/,
    });
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // Entry should be gone
    await expect(
      page.getByText("DEaDBeeF11111111111111111111111111111111111111"),
    ).not.toBeVisible();

    // Save
    await page.getByRole("button", { name: "Save Overrides" }).click();

    await expect(
      page.getByText("Policy overrides saved successfully"),
    ).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Error handling — backend 422
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — validation error", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, {
      plan: "pro",
      patchStatus: 422,
      patchBody: {
        detail: {
          error: "invalid_overrides",
          message: "One or more override values are invalid.",
          validation_errors: [
            "max_slippage_bps must be between 1 and 1000.",
          ],
        },
      },
    });
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("backend 422 validation error is surfaced to user", async ({ page }) => {
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();
    await page.getByLabel("Max Slippage (bps)").fill("50");
    await page.getByRole("button", { name: "Save Overrides" }).click();

    // Error banner should be displayed
    await expect(
      page.locator("p.text-red-300").filter({ hasText: /slippage|invalid|could not save/i }),
    ).toBeVisible({ timeout: 5_000 });

    // Should still be in edit mode (not exited)
    await expect(
      page.getByRole("button", { name: "Save Overrides" }),
    ).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Token policy editor
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — token policy editor", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("token mode selector is visible in edit mode", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();

    await expect(page.getByText("Token Access Policy")).toBeVisible();
    await expect(page.getByTestId("token-mode-unrestricted")).toBeVisible();
    await expect(page.getByTestId("token-mode-denylist")).toBeVisible();
    await expect(page.getByTestId("token-mode-allowlist")).toBeVisible();
  });

  test("switching to allowlist shows mint editor and quick-add buttons", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();
    await page.getByTestId("token-mode-allowlist").click();

    await expect(page.getByText("Quick add popular tokens:")).toBeVisible();
    await expect(page.getByPlaceholder("Token symbol or mint address")).toBeVisible();
    await expect(page.getByRole("button", { name: "+ SOL" })).toBeVisible();
  });

  test("quick-add adds a token chip and removes the quick-add button", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();
    await page.getByTestId("token-mode-allowlist").click();
    await page.getByRole("button", { name: "+ SOL" }).click();

    // Chip should appear
    await expect(page.getByLabel("Remove SOL")).toBeVisible();
    // Quick-add button for SOL should be gone
    await expect(page.getByRole("button", { name: "+ SOL" })).not.toBeVisible();
  });

  test("remove button on chip removes the token", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro_with_token_policy" });
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();

    // SOL and USDC chips should be present
    await expect(page.getByLabel("Remove SOL")).toBeVisible();
    await expect(page.getByLabel("Remove USDC")).toBeVisible();

    await page.getByLabel("Remove SOL").click();

    // SOL should be gone
    await expect(page.getByLabel("Remove SOL")).not.toBeVisible();
    // USDC should remain
    await expect(page.getByLabel("Remove USDC")).toBeVisible();
  });

  test("custom mint can be added via text input", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();
    await page.getByTestId("token-mode-allowlist").click();

    const input = page.getByPlaceholder("Token symbol or mint address");
    await input.fill("CustomMint123");
    await page.getByTestId("token-mint-add-btn").click();

    await expect(page.locator("[title='CustomMint123']")).toBeVisible();
  });

  test("save with allowlist includes token_policy in request", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();
    await page.getByTestId("token-mode-allowlist").click();
    await page.getByRole("button", { name: "+ USDC" }).click();

    // Capture the save request
    const [request] = await Promise.all([
      page.waitForRequest("**/api/customer/policy/overrides"),
      page.getByRole("button", { name: "Save Overrides" }).click(),
    ]);

    const body = request.postDataJSON();
    expect(body.overrides.token_policy).toBeDefined();
    expect(body.overrides.token_policy.mode).toBe("allowlist");
    expect(body.overrides.token_policy.allowed_mints).toContain("USDC");
  });

  test("existing token policy is loaded when entering edit mode", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro_with_token_policy" });
    await page.goto("/customer/policies");

    await page.getByRole("button", { name: "Edit Overrides" }).click();

    // Allowlist mode should be selected
    const allowlistBtn = page.getByTestId("token-mode-allowlist");
    await expect(allowlistBtn).toHaveClass(/border-amber/);

    // Mints should be loaded
    await expect(page.getByLabel("Remove SOL")).toBeVisible();
    await expect(page.getByLabel("Remove USDC")).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Effective Policy Preview
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — effective policy preview", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("policy at a glance section is visible in view mode", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-preview")).toBeVisible();
    await expect(page.getByText("Policy at a Glance")).toBeVisible();
    await expect(page.getByTestId("policy-rules")).toBeVisible();
  });

  test("plain-English rules describe effective policy", async ({ page }) => {
    await page.goto("/customer/policies");

    // Should have at least one rule
    const rules = page.getByTestId("policy-rules").locator("li");
    await expect(rules.first()).toBeVisible();
    const count = await rules.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("what-this-means outcomes section is shown", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-outcomes")).toBeVisible();
    await expect(page.getByText("What this means")).toBeVisible();
  });

  test("preview is hidden when entering edit mode", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-preview")).toBeVisible();

    await page.getByRole("button", { name: "Edit Overrides" }).click();

    await expect(page.getByTestId("policy-preview")).not.toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Policy Simulation — example outcomes
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — policy simulation", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("simulation section is visible in view mode", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-simulation")).toBeVisible();
    await expect(page.getByText("How Your Policy Behaves")).toBeVisible();
    await expect(page.getByTestId("simulation-scenarios")).toBeVisible();
  });

  test("scenario cards show Allowed and Denied outcomes", async ({ page }) => {
    await page.goto("/customer/policies");

    const badges = page.getByTestId("scenario-outcome");
    await expect(badges.first()).toBeVisible();
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(3);

    const texts = await badges.allTextContents();
    expect(texts.some((t) => t === "Allowed")).toBe(true);
    expect(texts.some((t) => t === "Denied")).toBe(true);
  });

  test("simulation section is hidden in edit mode", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-simulation")).toBeVisible();

    await page.getByRole("button", { name: "Edit Overrides" }).click();

    await expect(page.getByTestId("policy-simulation")).not.toBeVisible();
  });

  test("disclaimer text is visible", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(
      page.getByText("These examples reflect your current effective policy"),
    ).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Policy Recommendations
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — policy recommendations", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("recommendations section is visible in view mode", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    await expect(page.getByText("Policy Recommendations")).toBeVisible();
    await expect(page.getByTestId("recommendation-cards")).toBeVisible();
  });

  test("recommendation cards show priority and source labels", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    const priorities = page.getByTestId("recommendation-priority");
    await expect(priorities.first()).toBeVisible();
    const count = await priorities.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const sources = page.getByTestId("recommendation-source");
    await expect(sources.first()).toBeVisible();
  });

  test("recommendations section is hidden in edit mode", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    await page.getByRole("button", { name: "Edit Overrides" }).click();

    await expect(page.getByTestId("policy-recommendations")).not.toBeVisible();
  });

  test("advisory disclaimer is visible", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(
      page.getByText("recommendations are advisory"),
    ).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Unauthenticated — redirect
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — unauthenticated", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/customer/policies");

    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// History-aware policy recommendations
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — history-aware recommendations", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockReceiptSummaryRoute(page, { variant: "rich" });
    await injectCustomerAuth(page);
  });

  test("history-aware recommendation cards appear with rich summary data", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // At least one history-sourced recommendation should be present
    const sources = page.getByTestId("recommendation-source");
    const allSources = await sources.allTextContents();
    expect(allSources).toContain("Customer history");
  });

  test("source label shows 'Customer history' on history-based recommendations", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // Find all recommendation cards with "Customer history" source
    const historyCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-history-']");
    const count = await historyCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Every history card should have source label "Customer history"
    for (let i = 0; i < count; i++) {
      const sourceLabel = historyCards.nth(i).getByTestId("recommendation-source");
      await expect(sourceLabel).toHaveText("Customer history");
    }
  });

  test("evidence text is visible on history-based recommendation cards", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // Evidence text references receipt count and period — pick a specific card
    const slippageCard = page.getByTestId("recommendation-history-slippage-headroom");
    await expect(slippageCard).toBeVisible();
    await expect(
      slippageCard.getByText(`Based on ${RICH_HISTORY_SUMMARY.total_receipts} receipts`),
    ).toBeVisible();
  });

  test("slippage headroom recommendation appears when slippage cap is loose", async ({ page }) => {
    // PRO_POLICY effective has max_slippage_bps: 200, avg_slippage_bps in rich summary is 55
    // 200 > 55 * 3 = 165 → triggers slippage headroom
    await page.goto("/customer/policies");

    const slippageCard = page.getByTestId("recommendation-history-slippage-headroom");
    await expect(slippageCard).toBeVisible();
    await expect(slippageCard).toContainText("slippage cap is wider");
    await expect(slippageCard).toContainText("55 bps");
  });

  test("narrow-token recommendation appears when token usage is narrow and unrestricted", async ({ page }) => {
    // PRO policy has no token_policy (unrestricted), rich summary has 3 tokens
    await page.goto("/customer/policies");

    const tokenCard = page.getByTestId("recommendation-history-narrow-tokens");
    await expect(tokenCard).toBeVisible();
    await expect(tokenCard).toContainText("small set of tokens");
    await expect(tokenCard).toContainText("SOL, USDC, BONK");
  });

  test("simulation-failure recommendation appears when failures present and simulation not required", async ({ page }) => {
    // We need a policy where require_simulation_success is false
    // Default PRO_POLICY has require_simulation_success: true — need custom
    await mockPolicyRoutes(page, { plan: "pro" });

    // Override the policy route with simulation not required
    await page.route("**/api/customer/policy", (route) => {
      if (route.request().url().includes("/overrides")) return route.fallback();
      return route.fulfill({
        status: 200,
        json: {
          plan_code: "pro",
          plan_limits: {
            tx_limit_per_month: 5000,
            policy_overrides_enabled: true,
            max_notional_usd: 25000,
            max_value_sol: 1000,
            max_slippage_bps: 500,
            require_simulation_success: false,
          },
          overrides: { max_slippage_bps: 200 },
          effective: {
            tx_limit_per_month: 5000,
            max_notional_usd: 25000,
            max_value_sol: 1000,
            max_slippage_bps: 200,
            require_simulation_success: false,
          },
        },
      });
    });

    await page.goto("/customer/policies");

    const simCard = page.getByTestId("recommendation-history-simulation-failures");
    await expect(simCard).toBeVisible();
    await expect(simCard).toContainText("simulation failures detected");
    await expect(simCard).toContainText(`${RICH_HISTORY_SUMMARY.simulation_failures}`);
  });

  test("denial recommendation appears when denials are present in history", async ({ page }) => {
    await page.goto("/customer/policies");

    const denialCard = page.getByTestId("recommendation-history-recent-denials");
    await expect(denialCard).toBeVisible();
    await expect(denialCard).toContainText("denied");
    await expect(denialCard).toContainText("slippage_exceeded");
  });

  test("disclaimer mentions transaction history when history recs are shown", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    await expect(
      page.getByText("your own recent transaction history"),
    ).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// History recommendations — empty/unavailable degradation
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — empty history graceful degradation", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "pro" });
    await injectCustomerAuth(page);
  });

  test("empty summary shows only deterministic recommendations (no history cards)", async ({ page }) => {
    await mockReceiptSummaryRoute(page, { variant: "empty" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // No history-sourced recommendations should appear
    const historyCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-history-']");
    await expect(historyCards).toHaveCount(0);

    // Deterministic recommendations should still be present
    const sources = page.getByTestId("recommendation-source");
    const allSources = await sources.allTextContents();
    expect(allSources.length).toBeGreaterThanOrEqual(1);
    expect(allSources.every((s) => s !== "Customer history")).toBe(true);
  });

  test("failed summary fetch degrades to deterministic-only recommendations", async ({ page }) => {
    await mockReceiptSummaryRoute(page, { variant: "empty", status: 500 });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // No history cards
    const historyCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-history-']");
    await expect(historyCards).toHaveCount(0);

    // Disclaimer should NOT mention transaction history
    await expect(
      page.getByText("your own recent transaction history"),
    ).not.toBeVisible();
  });

  test("no summary mock at all still shows deterministic recommendations", async ({ page }) => {
    // No mockReceiptSummaryRoute called — request will 404 / fail
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // Deterministic recs present
    const sources = page.getByTestId("recommendation-source");
    await expect(sources.first()).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Mixed recommendation sources — deterministic + history coexistence
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — mixed recommendation sources", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockReceiptSummaryRoute(page, { variant: "rich" });
    await injectCustomerAuth(page);
  });

  test("deterministic and history recommendations coexist with accurate source labels", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    const sources = page.getByTestId("recommendation-source");
    const allSources = await sources.allTextContents();

    // Should have both deterministic and history sources
    expect(allSources.some((s) => s !== "Customer history")).toBe(true);
    expect(allSources.some((s) => s === "Customer history")).toBe(true);

    // Total recommendation count should be > the count from either source alone
    expect(allSources.length).toBeGreaterThanOrEqual(3);
  });

  test("narrow-tokens recommendation does not appear when token policy is allowlist", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro_with_token_policy" });
    await page.goto("/customer/policies");

    // Token policy is allowlist — narrow-tokens rec should NOT appear
    const tokenCard = page.getByTestId("recommendation-history-narrow-tokens");
    await expect(tokenCard).not.toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Recommendation action buttons (View setting →)
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — recommendation action buttons", () => {
  test.describe("deterministic recommendation actions", () => {
    test.beforeEach(async ({ page }) => {
      await silenceAnalytics(page);
      await mockAuthRoutes(page, { emailVerified: true });
      await mockDashboardRoutes(page);
      await mockPolicyRoutes(page, { plan: "pro" });
      await mockReceiptSummaryRoute(page);
      await injectCustomerAuth(page);
    });

    test("clicking 'View setting' on a deterministic recommendation enters edit mode", async ({ page }) => {
      await page.goto("/customer/policies");

      // Wait for recommendations to render
      await expect(page.getByTestId("policy-recommendations")).toBeVisible();

      // add-program-restrictions is the deterministic rec with fieldKey for PRO_POLICY
      const actionBtn = page.getByTestId("recommendation-action-add-program-restrictions");
      await expect(actionBtn).toBeVisible();
      await expect(actionBtn).toContainText("View setting");

      // Click the action button
      await actionBtn.click();

      // Recommendations section should be hidden (edit mode active)
      await expect(page.getByTestId("policy-recommendations")).not.toBeVisible();

      // Edit mode elements should be visible
      await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Save Overrides" })).toBeVisible();
    });

    test("'View setting' scrolls to and highlights the target field", async ({ page }) => {
      await page.goto("/customer/policies");

      await expect(page.getByTestId("policy-recommendations")).toBeVisible();

      // add-program-restrictions targets allowed_programs
      const actionBtn = page.getByTestId("recommendation-action-add-program-restrictions");
      await actionBtn.click();

      const targetField = page.locator('[data-field-key="allowed_programs"]').first();
      await expect(targetField).toBeVisible();

      // The element should have the highlight ring class applied briefly
      await expect(targetField).toHaveClass(/ring-amber-400/, { timeout: 2000 });
    });

    test("'View setting' on a programs recommendation targets the correct field", async ({ page }) => {
      await page.goto("/customer/policies");

      await expect(page.getByTestId("policy-recommendations")).toBeVisible();

      // add-program-restrictions targets allowed_programs
      const actionBtn = page.getByTestId("recommendation-action-add-program-restrictions");
      await expect(actionBtn).toBeVisible();
      await actionBtn.click();

      const targetField = page.locator('[data-field-key="allowed_programs"]').first();
      await expect(targetField).toBeVisible();
      await expect(targetField).toHaveClass(/ring-amber-400/, { timeout: 2000 });
    });

    test("recommendations without fieldKey do not render action button", async ({ page }) => {
      await page.goto("/customer/policies");

      await expect(page.getByTestId("policy-recommendations")).toBeVisible();

      // customize-policy has no fieldKey — should not have an action button
      const customizeCard = page.getByTestId("recommendation-customize-policy");
      if (await customizeCard.isVisible()) {
        await expect(
          customizeCard.getByRole("button", { name: /View setting/ }),
        ).not.toBeVisible();
      }
    });

    test("no action buttons on free plan even when fieldKey exists", async ({ page }) => {
      await mockPolicyRoutes(page, { plan: "free" });
      await page.goto("/customer/policies");

      await expect(page.getByTestId("policy-recommendations")).toBeVisible();

      // Free plan → overridesEnabled is false → no action buttons at all
      const actionButtons = page.locator("[data-testid^='recommendation-action-']");
      await expect(actionButtons).toHaveCount(0);
    });
  });

  test.describe("history-aware recommendation actions", () => {
    test.beforeEach(async ({ page }) => {
      await silenceAnalytics(page);
      await mockAuthRoutes(page, { emailVerified: true });
      await mockDashboardRoutes(page);
      await mockPolicyRoutes(page, { plan: "pro" });
      await mockReceiptSummaryRoute(page, { variant: "rich" });
      await injectCustomerAuth(page);
    });

    test("clicking 'View setting' on a history-aware recommendation enters edit mode", async ({ page }) => {
      await page.goto("/customer/policies");

      await expect(page.getByTestId("policy-recommendations")).toBeVisible();

      // Pick a history recommendation with fieldKey — e.g., history-slippage-headroom
      const actionBtn = page.getByTestId("recommendation-action-history-slippage-headroom");
      await expect(actionBtn).toBeVisible();
      await actionBtn.click();

      // Edit mode should be active
      await expect(page.getByTestId("policy-recommendations")).not.toBeVisible();
      await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    });

    test("history recommendation 'View setting' highlights correct field", async ({ page }) => {
      await page.goto("/customer/policies");

      await expect(page.getByTestId("policy-recommendations")).toBeVisible();

      // history-slippage-headroom targets max_slippage_bps
      const actionBtn = page.getByTestId("recommendation-action-history-slippage-headroom");
      await actionBtn.click();

      const targetField = page.locator('[data-field-key="max_slippage_bps"]').first();
      await expect(targetField).toBeVisible();
      await expect(targetField).toHaveClass(/ring-amber-400/, { timeout: 2000 });
    });

    test("history recommendation targeting token_policy highlights token group", async ({ page }) => {
      await page.goto("/customer/policies");

      await expect(page.getByTestId("policy-recommendations")).toBeVisible();

      // history-narrow-tokens targets token_policy
      const actionBtn = page.getByTestId("recommendation-action-history-narrow-tokens");
      await expect(actionBtn).toBeVisible();
      await actionBtn.click();

      const tokenGroup = page.locator('[data-field-key="token_policy"]');
      await expect(tokenGroup).toBeVisible();
      await expect(tokenGroup).toHaveClass(/ring-amber-400/, { timeout: 2000 });
    });

    test("history-recent-denials does not render action button (no fieldKey)", async ({ page }) => {
      await page.goto("/customer/policies");

      await expect(page.getByTestId("policy-recommendations")).toBeVisible();

      const denialCard = page.getByTestId("recommendation-history-recent-denials");
      await expect(denialCard).toBeVisible();

      // No action button since history-recent-denials has no fieldKey
      await expect(
        denialCard.getByRole("button", { name: /View setting/ }),
      ).not.toBeVisible();
    });
  });

  test.describe("edge cases", () => {
    test.beforeEach(async ({ page }) => {
      await silenceAnalytics(page);
      await mockAuthRoutes(page, { emailVerified: true });
      await mockDashboardRoutes(page);
      await mockReceiptSummaryRoute(page);
      await injectCustomerAuth(page);
    });

    test("recommendation section behaves correctly with no recommendations", async ({ page }) => {
      // Use a policy where all best practices are already followed:
      // simulation required, tight slippage, token allowlist set, programs restricted
      await page.route("**/api/customer/policy", (route) => {
        if (route.request().url().includes("/overrides")) return route.fallback();
        return route.fulfill({
          status: 200,
          json: {
            plan_code: "pro",
            plan_limits: {
              tx_limit_per_month: 5000,
              policy_overrides_enabled: true,
              max_notional_usd: 25000,
              max_value_sol: 1000,
              max_slippage_bps: 50,
              require_simulation_success: true,
            },
            overrides: {
              max_slippage_bps: 50,
              require_simulation_success: true,
              token_policy: { mode: "allowlist", allowed_mints: ["SOL", "USDC"], denied_mints: [] },
              allowed_programs: ["11111111111111111111111111111111"],
            },
            effective: {
              tx_limit_per_month: 5000,
              max_notional_usd: 25000,
              max_value_sol: 1000,
              max_slippage_bps: 50,
              require_simulation_success: true,
              token_policy: { mode: "allowlist", allowed_mints: ["SOL", "USDC"], denied_mints: [] },
              allowed_programs: ["11111111111111111111111111111111"],
            },
          },
        });
      });
      await page.goto("/customer/policies");

      // With tight policy + empty history, should have very few/no recommendations
      // The section may not render at all, or render with zero cards
      const recSection = page.getByTestId("policy-recommendations");
      const isVisible = await recSection.isVisible().catch(() => false);
      if (isVisible) {
        // If section is visible, action buttons should only exist on cards with fieldKey
        const cards = page.getByTestId("recommendation-cards").locator("[data-testid^='recommendation-']");
        const count = await cards.count();
        for (let i = 0; i < count; i++) {
          const card = cards.nth(i);
          const cardTestId = await card.getAttribute("data-testid");
          if (!cardTestId || cardTestId.startsWith("recommendation-action-")) continue;
          // Each card's action button should only exist when the card has fieldKey
          const actionBtn = card.locator("[data-testid^='recommendation-action-']");
          const btnCount = await actionBtn.count();
          // Action buttons should be at most 1 per card
          expect(btnCount).toBeLessThanOrEqual(1);
        }
      }
    });

    test("highlight clears after timeout (does not persist)", async ({ page }) => {
      await mockPolicyRoutes(page, { plan: "pro" });
      await page.goto("/customer/policies");

      await expect(page.getByTestId("policy-recommendations")).toBeVisible();

      const actionBtn = page.getByTestId("recommendation-action-add-program-restrictions");
      await actionBtn.click();

      const targetField = page.locator('[data-field-key="allowed_programs"]').first();

      // Highlight appears
      await expect(targetField).toHaveClass(/ring-amber-400/, { timeout: 2000 });

      // Highlight clears after ~1.5s
      await expect(targetField).not.toHaveClass(/ring-amber-400/, { timeout: 5000 });
    });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Market-aware policy recommendations — degraded/stressed conditions
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — market-aware recommendations (degraded)", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("market-aware recommendation cards appear when conditions are degraded", async ({ page }) => {
    // Policy with simulation NOT required — triggers market-enable-simulation
    await page.route("**/api/customer/policy", (route) => {
      if (route.request().url().includes("/overrides")) return route.fallback();
      return route.fulfill({
        status: 200,
        json: {
          plan_code: "pro",
          plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 500, require_simulation_success: false },
          overrides: { max_slippage_bps: 200 },
          effective: { tx_limit_per_month: 5000, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 200, require_simulation_success: false },
        },
      });
    });
    await mockMarketConditionsRoute(page, { variant: "degraded" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    const marketCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-market-']");
    const count = await marketCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("source label shows 'Market analysis' on market-based recommendations", async ({ page }) => {
    await page.route("**/api/customer/policy", (route) => {
      if (route.request().url().includes("/overrides")) return route.fallback();
      return route.fulfill({
        status: 200,
        json: {
          plan_code: "pro",
          plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 500, require_simulation_success: false },
          overrides: { max_slippage_bps: 200 },
          effective: { tx_limit_per_month: 5000, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 200, require_simulation_success: false },
        },
      });
    });
    await mockMarketConditionsRoute(page, { variant: "degraded" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    const sources = page.getByTestId("recommendation-source");
    const allSources = await sources.allTextContents();
    expect(allSources).toContain("Market analysis");
  });

  test("evidence text is visible on market-based recommendation cards", async ({ page }) => {
    await page.route("**/api/customer/policy", (route) => {
      if (route.request().url().includes("/overrides")) return route.fallback();
      return route.fulfill({
        status: 200,
        json: {
          plan_code: "pro",
          plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 500, require_simulation_success: false },
          overrides: { max_slippage_bps: 200 },
          effective: { tx_limit_per_month: 5000, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 200, require_simulation_success: false },
        },
      });
    });
    await mockMarketConditionsRoute(page, { variant: "degraded" });
    await page.goto("/customer/policies");

    const simCard = page.getByTestId("recommendation-market-enable-simulation");
    await expect(simCard).toBeVisible();

    // Evidence text should contain the summary from the market conditions fixture
    await expect(
      simCard.locator("p.italic"),
    ).toContainText("degradation");
  });
});

test.describe("customer policies — market-aware recommendations (stressed)", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("simulation-related market recommendation appears when stressed + simulation not required", async ({ page }) => {
    await page.route("**/api/customer/policy", (route) => {
      if (route.request().url().includes("/overrides")) return route.fallback();
      return route.fulfill({
        status: 200,
        json: {
          plan_code: "pro",
          plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 500, require_simulation_success: false },
          overrides: { max_slippage_bps: 200 },
          effective: { tx_limit_per_month: 5000, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 200, require_simulation_success: false },
        },
      });
    });
    await mockMarketConditionsRoute(page, { variant: "stressed" });
    await page.goto("/customer/policies");

    const simCard = page.getByTestId("recommendation-market-enable-simulation");
    await expect(simCard).toBeVisible();
    await expect(simCard).toContainText("Enable simulation");

    // Priority should be high when stressed
    const priority = simCard.getByTestId("recommendation-priority");
    await expect(priority).toHaveText("High priority");
  });

  test("slippage-tightening recommendation appears when stressed + loose slippage", async ({ page }) => {
    await page.route("**/api/customer/policy", (route) => {
      if (route.request().url().includes("/overrides")) return route.fallback();
      return route.fulfill({
        status: 200,
        json: {
          plan_code: "pro",
          plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 500, require_simulation_success: true },
          overrides: { max_slippage_bps: 200 },
          effective: { tx_limit_per_month: 5000, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 200, require_simulation_success: true },
        },
      });
    });
    await mockMarketConditionsRoute(page, { variant: "stressed" });
    await page.goto("/customer/policies");

    const slippageCard = page.getByTestId("recommendation-market-tighten-slippage");
    await expect(slippageCard).toBeVisible();
    await expect(slippageCard).toContainText("tightening slippage");
    await expect(slippageCard).toContainText("200 bps");
  });

  test("transaction submission throttling recommendation appears when sendTransaction is throttled", async ({ page }) => {
    await page.route("**/api/customer/policy", (route) => {
      if (route.request().url().includes("/overrides")) return route.fallback();
      return route.fulfill({
        status: 200,
        json: {
          plan_code: "pro",
          plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 500, require_simulation_success: false },
          overrides: { max_slippage_bps: 200 },
          effective: { tx_limit_per_month: 5000, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 200, require_simulation_success: false },
        },
      });
    });
    // MARKET_STRESSED includes sendTransaction in throttled_methods
    await mockMarketConditionsRoute(page, { variant: "stressed" });
    await page.goto("/customer/policies");

    const txCard = page.getByTestId("recommendation-market-tx-submission-throttled");
    await expect(txCard).toBeVisible();
    await expect(txCard).toContainText("submission is being throttled");

    const priority = txCard.getByTestId("recommendation-priority");
    await expect(priority).toHaveText("High priority");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Market-aware + deterministic + history recommendation coexistence
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — all three recommendation sources coexist", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockReceiptSummaryRoute(page, { variant: "rich" });
    await injectCustomerAuth(page);
  });

  test("deterministic, history, and market recommendations coexist with accurate source labels", async ({ page }) => {
    // Need simulation NOT required so market rec triggers
    await page.route("**/api/customer/policy", (route) => {
      if (route.request().url().includes("/overrides")) return route.fallback();
      return route.fulfill({
        status: 200,
        json: {
          plan_code: "pro",
          plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 500, require_simulation_success: false },
          overrides: { max_slippage_bps: 200 },
          effective: { tx_limit_per_month: 5000, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 200, require_simulation_success: false },
        },
      });
    });
    await mockMarketConditionsRoute(page, { variant: "stressed" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    const sources = page.getByTestId("recommendation-source");
    const allSources = await sources.allTextContents();

    // All three source types should be represented
    expect(allSources.some((s) => s === "Default guidance")).toBe(true);
    expect(allSources.some((s) => s === "Customer history")).toBe(true);
    expect(allSources.some((s) => s === "Market analysis")).toBe(true);

    expect(allSources.length).toBeGreaterThanOrEqual(4);
  });

  test("disclaimer mentions execution conditions when market recs are present", async ({ page }) => {
    await page.route("**/api/customer/policy", (route) => {
      if (route.request().url().includes("/overrides")) return route.fallback();
      return route.fulfill({
        status: 200,
        json: {
          plan_code: "pro",
          plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 500, require_simulation_success: false },
          overrides: { max_slippage_bps: 200 },
          effective: { tx_limit_per_month: 5000, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 200, require_simulation_success: false },
        },
      });
    });
    await mockMarketConditionsRoute(page, { variant: "degraded" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    await expect(
      page.getByText("current execution infrastructure conditions"),
    ).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Market-aware recommendations — stable / no-signal / failure degradation
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — market-aware graceful degradation", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("stable market conditions produce no market recommendation cards", async ({ page }) => {
    await mockMarketConditionsRoute(page, { variant: "stable" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    const marketCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-market-']");
    await expect(marketCards).toHaveCount(0);

    // "Market analysis" source badge should not appear
    const sources = page.getByTestId("recommendation-source");
    const allSources = await sources.allTextContents();
    expect(allSources.every((s) => s !== "Market analysis")).toBe(true);
  });

  test("failed market-conditions fetch degrades gracefully without breaking the page", async ({ page }) => {
    await mockMarketConditionsRoute(page, { variant: "stable", status: 500 });
    await page.goto("/customer/policies");

    // Page still loads — policy recommendations section should be visible
    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // No market cards
    const marketCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-market-']");
    await expect(marketCards).toHaveCount(0);

    // Disclaimer should NOT mention execution conditions
    await expect(
      page.getByText("current execution infrastructure conditions"),
    ).not.toBeVisible();
  });

  test("no market-conditions mock at all still shows deterministic recommendations", async ({ page }) => {
    // No mockMarketConditionsRoute called — request will fail
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // Deterministic recs present
    const sources = page.getByTestId("recommendation-source");
    await expect(sources.first()).toBeVisible();

    // No market cards
    const marketCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-market-']");
    await expect(marketCards).toHaveCount(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Market-aware recommendation action buttons
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — market recommendation action buttons", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("clicking 'View setting' on market-enable-simulation enters edit mode and highlights field", async ({ page }) => {
    await page.route("**/api/customer/policy", (route) => {
      if (route.request().url().includes("/overrides")) return route.fallback();
      return route.fulfill({
        status: 200,
        json: {
          plan_code: "pro",
          plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 500, require_simulation_success: false },
          overrides: { max_slippage_bps: 200 },
          effective: { tx_limit_per_month: 5000, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 200, require_simulation_success: false },
        },
      });
    });
    await mockMarketConditionsRoute(page, { variant: "stressed" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    const actionBtn = page.getByTestId("recommendation-action-market-enable-simulation");
    await expect(actionBtn).toBeVisible();
    await expect(actionBtn).toContainText("View setting");
    await actionBtn.click();

    // Edit mode should be active
    await expect(page.getByTestId("policy-recommendations")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // require_simulation_success field should be highlighted
    const targetField = page.locator('[data-field-key="require_simulation_success"]').first();
    await expect(targetField).toBeVisible();
    await expect(targetField).toHaveClass(/ring-amber-400/, { timeout: 2000 });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Policy Intelligence (PIL) recommendations
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — PIL recommendations", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockReceiptSummaryRoute(page);
    await mockMarketConditionsRoute(page);
    await injectCustomerAuth(page);
  });

  test("PIL recommendation cards appear with Policy Intelligence source label", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockPilRecommendationsRoute(page, { variant: "with-recs" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const pilCard = page.getByTestId("recommendation-pil-reduce-slippage");
    await expect(pilCard).toBeVisible();
    await expect(pilCard).toContainText("Policy Intelligence");
  });

  test("PIL evidence text is visible on recommendation cards", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockPilRecommendationsRoute(page, { variant: "with-recs" });
    await page.goto("/customer/policies");

    const pilCard = page.getByTestId("recommendation-pil-reduce-slippage");
    await expect(pilCard).toBeVisible();
    await expect(pilCard).toContainText("avg_slippage=95bps");
  });

  test("PIL confidence indicator is shown", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockPilRecommendationsRoute(page, { variant: "with-recs" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("recommendation-pil-reduce-slippage")).toBeVisible();
    const confidenceEls = page.getByTestId("recommendation-confidence");
    await expect(confidenceEls.first()).toBeVisible();
    await expect(confidenceEls.first()).toContainText("Confidence:");
  });

  test("PIL recs coexist with deterministic and market recommendations", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockMarketConditionsRoute(page, { variant: "stressed" });
    await mockPilRecommendationsRoute(page, { variant: "with-recs" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // Should have Default guidance / Policy analysis AND Policy Intelligence AND Market analysis
    const sources = page.getByTestId("recommendation-source");
    const texts = await sources.allTextContents();
    expect(texts).toContain("Policy Intelligence");
    expect(texts.some((t) => t === "Market analysis")).toBe(true);
  });

  test("empty PIL response shows zero PIL cards", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockPilRecommendationsRoute(page, { variant: "empty" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    // No PIL cards
    const sources = page.getByTestId("recommendation-source");
    const texts = await sources.allTextContents();
    expect(texts).not.toContain("Policy Intelligence");
  });

  test("failed PIL fetch degrades gracefully (no crash, no PIL cards)", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockPilRecommendationsRoute(page, { status: 502 });
    await page.goto("/customer/policies");

    // Page should still load and show deterministic recs
    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const sources = page.getByTestId("recommendation-source");
    const texts = await sources.allTextContents();
    expect(texts).not.toContain("Policy Intelligence");
  });

  test("missing PIL mock (no route) still shows deterministic recs", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    // Intentionally NOT mocking PIL route
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    // Deterministic recs should be present
    const sources = page.getByTestId("recommendation-source");
    const texts = await sources.allTextContents();
    expect(texts.length).toBeGreaterThan(0);
    expect(texts).not.toContain("Policy Intelligence");
  });

  test("disclaimer mentions policy intelligence when PIL recs present", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockPilRecommendationsRoute(page, { variant: "with-recs" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("recommendation-pil-reduce-slippage")).toBeVisible();
    await expect(page.getByText(/policy intelligence analysis/).first()).toBeVisible();
  });

  test("View setting button on PIL rec with fieldKey enters edit mode", async ({ page }) => {
    await page.route("**/api/customer/policy", (route) => {
      if (route.request().url().includes("/overrides")) return route.fallback();
      return route.fulfill({
        status: 200,
        json: {
          plan_code: "pro",
          plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 500, require_simulation_success: true },
          overrides: { max_slippage_bps: 200 },
          effective: { tx_limit_per_month: 5000, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 200, require_simulation_success: true },
        },
      });
    });
    await mockPilRecommendationsRoute(page, { variant: "with-recs" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("recommendation-pil-reduce-slippage")).toBeVisible();
    const actionBtn = page.getByTestId("recommendation-action-pil-reduce-slippage");
    await expect(actionBtn).toBeVisible();
    await expect(actionBtn).toContainText("View setting");
    await actionBtn.click();

    // Edit mode should be active
    await expect(page.getByTestId("policy-recommendations")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // max_slippage_bps field should be highlighted
    const targetField = page.locator('[data-field-key="max_slippage_bps"]').first();
    await expect(targetField).toBeVisible();
    await expect(targetField).toHaveClass(/ring-amber-400/, { timeout: 2000 });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Plan-aware recommendation tiering
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — plan-aware recommendation tiering", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await injectCustomerAuth(page);
  });

  test("Free plan with gated PIL shows upgrade teaser", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "free" });
    await mockReceiptSummaryRoute(page, { variant: "rich" });
    await mockMarketConditionsRoute(page, { variant: "stressed" });
    await mockPilRecommendationsRoute(page, { variant: "gated" });
    await page.goto("/customer/policies");

    const teaser = page.getByTestId("recommendation-upgrade-teaser");
    await expect(teaser).toBeVisible();
    await expect(teaser).toContainText("Unlock deeper policy intelligence");

    const upgradeLink = page.getByTestId("recommendation-upgrade-link");
    await expect(upgradeLink).toBeVisible();
    await expect(upgradeLink).toHaveAttribute("href", /\/customer\/upgrades/);
  });

  test("Free plan teaser shows gated_count from PIL", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "free" });
    await mockReceiptSummaryRoute(page);
    await mockPilRecommendationsRoute(page, { variant: "gated" });
    await page.goto("/customer/policies");

    const teaser = page.getByTestId("recommendation-upgrade-teaser");
    await expect(teaser).toBeVisible();
    await expect(teaser).toContainText("3 intelligence-backed suggestions");
  });

  test("Free plan hides Customer history and Market analysis sources", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "free" });
    await mockReceiptSummaryRoute(page, { variant: "rich" });
    await mockMarketConditionsRoute(page, { variant: "stressed" });
    await mockPilRecommendationsRoute(page, { variant: "gated" });
    await mockCohortBenchmarksRoute(page, { variant: "gated" });
    await page.goto("/customer/policies");

    // Wait for recommendations section
    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // PIL source labels should not appear on recommendation cards (may appear in teaser)
    const pilSourceLabels = page.getByTestId("recommendation-source").filter({ hasText: "Policy Intelligence" });
    await expect(pilSourceLabels).toHaveCount(0);
    await expect(page.getByTestId("recommendation-history-avg-txn-far-below-limit")).not.toBeVisible();
    await expect(page.getByTestId("recommendation-market-tx-submission-throttled")).not.toBeVisible();
  });

  test("Pro plan shows all recommendation sources without teaser", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockReceiptSummaryRoute(page, { variant: "rich" });
    await mockMarketConditionsRoute(page, { variant: "stressed" });
    await mockPilRecommendationsRoute(page, { variant: "with-recs" });
    await mockCohortBenchmarksRoute(page, { variant: "empty" });
    await page.goto("/customer/policies");

    // PIL recs should render
    await expect(page.getByTestId("recommendation-pil-reduce-slippage")).toBeVisible();

    // History recs should render
    await expect(page.getByTestId("recommendation-history-limit-headroom")).toBeVisible();

    // Upgrade teaser should NOT be present
    await expect(page.getByTestId("recommendation-upgrade-teaser")).not.toBeVisible();
  });

  test("Free plan with no gated data shows no teaser", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "free" });
    await mockReceiptSummaryRoute(page);
    await mockPilRecommendationsRoute(page, { variant: "empty" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    await expect(page.getByTestId("recommendation-upgrade-teaser")).not.toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Cohort benchmark recommendations — Advanced user sees benchmarks
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — cohort benchmark recommendations (Advanced+)", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "advanced" });
    await mockReceiptSummaryRoute(page);
    await mockCohortBenchmarksRoute(page, { variant: "full" });
    await injectCustomerAuth(page);
  });

  test("Advanced user sees cohort benchmark recommendation cards", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const benchCard = page.getByTestId("recommendation-bench-cohort-slippage-loose");
    await expect(benchCard).toBeVisible();
    await expect(benchCard).toContainText("Slippage tolerance is wider than most");
  });

  test("source label shows 'Cohort benchmark' on benchmark cards", async ({ page }) => {
    await page.goto("/customer/policies");

    const benchCard = page.getByTestId("recommendation-bench-cohort-slippage-loose");
    await expect(benchCard).toBeVisible();
    const source = benchCard.getByTestId("recommendation-source");
    await expect(source).toHaveText("Cohort benchmark");
  });

  test("evidence text is visible on cohort benchmark cards", async ({ page }) => {
    await page.goto("/customer/policies");

    const benchCard = page.getByTestId("recommendation-bench-cohort-slippage-loose");
    await expect(benchCard).toBeVisible();
    await expect(benchCard).toContainText("aggregated data from 47");
  });

  test("confidence indicator is shown on cohort benchmark cards", async ({ page }) => {
    await page.goto("/customer/policies");

    const benchCard = page.getByTestId("recommendation-bench-cohort-slippage-loose");
    await expect(benchCard).toBeVisible();
    const confidence = benchCard.getByTestId("recommendation-confidence");
    await expect(confidence).toBeVisible();
    await expect(confidence).toContainText("Confidence:");
  });

  test("Enterprise user also sees cohort benchmark cards", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "enterprise" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("recommendation-bench-cohort-slippage-loose")).toBeVisible();
    await expect(page.getByTestId("recommendation-bench-cohort-usd-limit-high")).toBeVisible();
  });

  test("Advanced user does not see upgrade teaser when benchmarks available", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("recommendation-bench-cohort-slippage-loose")).toBeVisible();
    await expect(page.getByTestId("recommendation-upgrade-teaser")).not.toBeVisible();
  });

  test("disclaimer mentions cohort benchmarks when benchmark recs present", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("recommendation-bench-cohort-slippage-loose")).toBeVisible();
    await expect(page.getByText(/aggregated cohort benchmarks/).first()).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Cohort benchmark recommendations — Free/Pro gating & teaser
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — cohort benchmark gating (Free/Pro)", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await injectCustomerAuth(page);
  });

  test("Free user does not see benchmark cards", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "free" });
    await mockReceiptSummaryRoute(page);
    await mockCohortBenchmarksRoute(page, { variant: "gated" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const benchCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-bench-']");
    await expect(benchCards).toHaveCount(0);
  });

  test("Pro user does not see benchmark cards", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockReceiptSummaryRoute(page);
    await mockCohortBenchmarksRoute(page, { variant: "gated" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const benchCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-bench-']");
    await expect(benchCards).toHaveCount(0);
  });

  test("Free user sees upgrade teaser when gated benchmarks exist", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "free" });
    await mockReceiptSummaryRoute(page);
    await mockPilRecommendationsRoute(page, { variant: "empty" });
    await mockCohortBenchmarksRoute(page, { variant: "gated" });
    await page.goto("/customer/policies");

    const teaser = page.getByTestId("recommendation-upgrade-teaser");
    await expect(teaser).toBeVisible();
    await expect(teaser).toContainText("Cohort benchmark");
    await expect(teaser).toContainText("2 cohort benchmarks");
  });

  test("teaser shows 'Advanced' tier label when benchmark source is gated", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "free" });
    await mockReceiptSummaryRoute(page);
    await mockPilRecommendationsRoute(page, { variant: "empty" });
    await mockCohortBenchmarksRoute(page, { variant: "gated" });
    await page.goto("/customer/policies");

    const teaser = page.getByTestId("recommendation-upgrade-teaser");
    await expect(teaser).toBeVisible();
    // When cohort benchmark is among gated sources, tierLabel = "Advanced"
    await expect(teaser).toContainText("Upgrade to Advanced");
    await expect(teaser).toContainText("View Advanced plans");
  });

  test("Pro user with gated PIL + gated benchmarks sees combined teaser", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockReceiptSummaryRoute(page);
    await mockPilRecommendationsRoute(page, { variant: "gated" });
    await mockCohortBenchmarksRoute(page, { variant: "gated" });
    await page.goto("/customer/policies");

    const teaser = page.getByTestId("recommendation-upgrade-teaser");
    await expect(teaser).toBeVisible();
    // Should list both gated sources
    await expect(teaser).toContainText("Cohort benchmark");
    // PIL is also gated for pro? Actually PIL is available for pro (SOURCE_MIN_TIER pro=1).
    // But the mock returns gated=true — the gating check uses !canPil which is false for pro.
    // So only benchmark shows in gated for pro. Let's assert benchmark is present.
    await expect(teaser).toContainText("Advanced");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Cohort benchmark — graceful degradation
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — cohort benchmark degradation", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "advanced" });
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("empty benchmark response renders no benchmark cards", async ({ page }) => {
    await mockCohortBenchmarksRoute(page, { variant: "empty" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const benchCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-bench-']");
    await expect(benchCards).toHaveCount(0);
  });

  test("failed benchmark fetch degrades gracefully (no crash)", async ({ page }) => {
    await mockCohortBenchmarksRoute(page, { status: 502 });
    await page.goto("/customer/policies");

    // Page should still load and show deterministic recs
    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const sources = page.getByTestId("recommendation-source");
    const texts = await sources.allTextContents();
    expect(texts).not.toContain("Cohort benchmark");
  });

  test("missing benchmark route still shows deterministic recs", async ({ page }) => {
    // Intentionally NOT mocking benchmark route
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const sources = page.getByTestId("recommendation-source");
    const texts = await sources.allTextContents();
    expect(texts.length).toBeGreaterThan(0);
    expect(texts).not.toContain("Cohort benchmark");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Cohort benchmark — mixed-source coexistence
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — cohort benchmarks coexist with other sources", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await injectCustomerAuth(page);
  });

  test("all five sources coexist for Advanced user", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "advanced" });
    await mockReceiptSummaryRoute(page, { variant: "rich" });
    await mockMarketConditionsRoute(page, { variant: "stressed" });
    await mockPilRecommendationsRoute(page, { variant: "with-recs" });
    await mockCohortBenchmarksRoute(page, { variant: "full" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    const sources = page.getByTestId("recommendation-source");
    const allSources = await sources.allTextContents();

    expect(allSources.some((s) => s === "Default guidance" || s === "Policy analysis")).toBe(true);
    expect(allSources).toContain("Customer history");
    expect(allSources).toContain("Market analysis");
    expect(allSources).toContain("Policy Intelligence");
    expect(allSources).toContain("Cohort benchmark");
    expect(allSources.length).toBeGreaterThanOrEqual(5);
  });

  test("benchmark and PIL source labels remain distinct", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "advanced" });
    await mockReceiptSummaryRoute(page);
    await mockPilRecommendationsRoute(page, { variant: "with-recs" });
    await mockCohortBenchmarksRoute(page, { variant: "full" });
    await page.goto("/customer/policies");

    // PIL card
    const pilCard = page.getByTestId("recommendation-pil-reduce-slippage");
    await expect(pilCard).toBeVisible();
    await expect(pilCard.getByTestId("recommendation-source")).toHaveText("Policy Intelligence");

    // Benchmark card
    const benchCard = page.getByTestId("recommendation-bench-cohort-slippage-loose");
    await expect(benchCard).toBeVisible();
    await expect(benchCard.getByTestId("recommendation-source")).toHaveText("Cohort benchmark");
  });

  test("upgrade teaser not shown when Advanced user has all sources", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "advanced" });
    await mockReceiptSummaryRoute(page, { variant: "rich" });
    await mockMarketConditionsRoute(page, { variant: "stressed" });
    await mockPilRecommendationsRoute(page, { variant: "with-recs" });
    await mockCohortBenchmarksRoute(page, { variant: "full" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    await expect(page.getByTestId("recommendation-upgrade-teaser")).not.toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// External context recommendations — Enterprise only
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — external context recommendations (Enterprise)", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "enterprise" });
    await mockReceiptSummaryRoute(page);
    await mockExternalContextRoute(page, { variant: "full" });
    await injectCustomerAuth(page);
  });

  test("Enterprise user sees external context recommendation cards", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const extCard = page.getByTestId("recommendation-ext-ext-sustained-throttle");
    await expect(extCard).toBeVisible();
    await expect(extCard).toContainText("Sustained external network pressure");
  });

  test("source label shows 'External context' on external context cards", async ({ page }) => {
    await page.goto("/customer/policies");

    const extCard = page.getByTestId("recommendation-ext-ext-sustained-throttle");
    await expect(extCard).toBeVisible();
    const source = extCard.getByTestId("recommendation-source");
    await expect(source).toHaveText("External context");
  });

  test("evidence text is visible on external context cards", async ({ page }) => {
    await page.goto("/customer/policies");

    const extCard = page.getByTestId("recommendation-ext-ext-sustained-throttle");
    await expect(extCard).toBeVisible();
    await expect(extCard).toContainText("sustained pressure for 6 consecutive");
  });

  test("confidence indicator is shown on external context cards", async ({ page }) => {
    await page.goto("/customer/policies");

    const extCard = page.getByTestId("recommendation-ext-ext-sustained-throttle");
    await expect(extCard).toBeVisible();
    const confidence = extCard.getByTestId("recommendation-confidence");
    await expect(confidence).toBeVisible();
    await expect(confidence).toContainText("Confidence:");
  });

  test("disclaimer mentions external infrastructure when external recs present", async ({ page }) => {
    await page.goto("/customer/policies");

    await expect(page.getByTestId("recommendation-ext-ext-sustained-throttle")).toBeVisible();
    await expect(page.getByText(/external infrastructure signals/).first()).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// External context gating — Free / Pro / Advanced cannot see bodies
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — external context gating (below Enterprise)", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await injectCustomerAuth(page);
  });

  test("Advanced user does not see external context cards", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "advanced" });
    await mockReceiptSummaryRoute(page);
    await mockExternalContextRoute(page, { variant: "gated" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const extCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-ext-']");
    await expect(extCards).toHaveCount(0);
  });

  test("Advanced user sees upgrade teaser when gated external context exists", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "advanced" });
    await mockReceiptSummaryRoute(page);
    await mockPilRecommendationsRoute(page, { variant: "empty" });
    await mockCohortBenchmarksRoute(page, { variant: "empty" });
    await mockExternalContextRoute(page, { variant: "gated" });
    await page.goto("/customer/policies");

    const teaser = page.getByTestId("recommendation-upgrade-teaser");
    await expect(teaser).toBeVisible();
    await expect(teaser).toContainText("External context");
    await expect(teaser).toContainText("2 external context signals");
  });

  test("teaser shows 'Enterprise' tier label when external context is gated", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "advanced" });
    await mockReceiptSummaryRoute(page);
    await mockPilRecommendationsRoute(page, { variant: "empty" });
    await mockCohortBenchmarksRoute(page, { variant: "empty" });
    await mockExternalContextRoute(page, { variant: "gated" });
    await page.goto("/customer/policies");

    const teaser = page.getByTestId("recommendation-upgrade-teaser");
    await expect(teaser).toBeVisible();
    await expect(teaser).toContainText("Upgrade to Enterprise");
    await expect(teaser).toContainText("View Enterprise plans");
  });

  test("Free user with gated PIL + gated benchmarks + gated external sees combined teaser", async ({ page }) => {
    await mockPolicyRoutes(page, { plan: "free" });
    await mockReceiptSummaryRoute(page);
    await mockPilRecommendationsRoute(page, { variant: "gated" });
    await mockCohortBenchmarksRoute(page, { variant: "gated" });
    await mockExternalContextRoute(page, { variant: "gated" });
    await page.goto("/customer/policies");

    const teaser = page.getByTestId("recommendation-upgrade-teaser");
    await expect(teaser).toBeVisible();
    // Should mention all three gated sources
    const details = page.getByTestId("gated-source-details");
    await expect(details).toBeVisible();
    await expect(details).toContainText("Policy Intelligence");
    await expect(details).toContainText("Cohort benchmark");
    await expect(details).toContainText("External context");
    // Enterprise tier label because External context is the highest gated source
    await expect(teaser).toContainText("Enterprise");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Signal freshness badges — market analysis
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — market signal freshness badges", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "pro" });
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("fresh market signal shows 'Live' badge", async ({ page }) => {
    await mockMarketConditionsRoute(page, { variant: "stable" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const badge = page.getByTestId("freshness-badge-market-analysis");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("Live");
  });

  test("stale market signal shows 'Data may be outdated' badge", async ({ page }) => {
    await mockMarketConditionsRoute(page, { variant: "stale" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const badge = page.getByTestId("freshness-badge-market-analysis");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("Data may be outdated");
  });

  test("unavailable market signal shows 'Signal unavailable' badge", async ({ page }) => {
    await mockMarketConditionsRoute(page, { variant: "unavailable" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const badge = page.getByTestId("freshness-badge-market-analysis");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("Signal unavailable");
  });

  test("stale market signal still renders recommendation cards with stale note in summary", async ({ page }) => {
    // Stale fixture is based on MARKET_DEGRADED — which has environment=degraded
    // The summary should still be visible on market rec cards
    await page.route("**/api/customer/policy", (route) => {
      if (route.request().url().includes("/overrides")) return route.fallback();
      return route.fulfill({
        status: 200,
        json: {
          plan_code: "pro",
          plan_limits: { tx_limit_per_month: 5000, policy_overrides_enabled: true, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 500, require_simulation_success: false },
          overrides: { max_slippage_bps: 200 },
          effective: { tx_limit_per_month: 5000, max_notional_usd: 25000, max_value_sol: 1000, max_slippage_bps: 200, require_simulation_success: false },
        },
      });
    });
    await mockMarketConditionsRoute(page, { variant: "stale" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // Market recs should still render from the degraded data
    const marketCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-market-']");
    const count = await marketCards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Badge shows stale
    const badge = page.getByTestId("freshness-badge-market-analysis");
    await expect(badge).toHaveText("Data may be outdated");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Signal freshness badges — external context
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — external context signal freshness badges", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "enterprise" });
    await mockReceiptSummaryRoute(page);
    await injectCustomerAuth(page);
  });

  test("fresh external-context signal shows 'Live' badge", async ({ page }) => {
    await mockExternalContextRoute(page, { variant: "full" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const badge = page.getByTestId("freshness-badge-external-context");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("Live");
  });

  test("stale external-context signal shows 'Data may be outdated' badge", async ({ page }) => {
    await mockExternalContextRoute(page, { variant: "stale" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const badge = page.getByTestId("freshness-badge-external-context");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("Data may be outdated");
  });

  test("stale external-context does NOT render misleading recommendation cards", async ({ page }) => {
    await mockExternalContextRoute(page, { variant: "stale" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // Stale external context returns empty recommendations — no ext-* cards
    const extCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-ext-']");
    await expect(extCards).toHaveCount(0);

    // Badge is still visible and shows stale
    const badge = page.getByTestId("freshness-badge-external-context");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("Data may be outdated");
  });

  test("unavailable external-context signal shows 'Signal unavailable' badge", async ({ page }) => {
    await mockExternalContextRoute(page, { variant: "unavailable" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
    const badge = page.getByTestId("freshness-badge-external-context");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("Signal unavailable");
  });

  test("unavailable external-context degrades gracefully with no broken UI", async ({ page }) => {
    await mockExternalContextRoute(page, { variant: "unavailable" });
    await page.goto("/customer/policies");

    // Page loads without errors — core sections visible
    await expect(
      page.getByRole("heading", { name: "Policy & Protections" }),
    ).toBeVisible();
    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // No external context recommendation cards
    const extCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-ext-']");
    await expect(extCards).toHaveCount(0);

    // Badge renders correctly
    const badge = page.getByTestId("freshness-badge-external-context");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("Signal unavailable");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Signal freshness — stale/unavailable coexist with other recommendation sources
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — signal freshness coexists with other sources", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "enterprise" });
    await mockReceiptSummaryRoute(page, { variant: "rich" });
    await mockPilRecommendationsRoute(page, { variant: "with-recs" });
    await mockCohortBenchmarksRoute(page, { variant: "full" });
    await injectCustomerAuth(page);
  });

  test("stale market + stale external do not break deterministic/history/PIL/cohort recs", async ({ page }) => {
    await mockMarketConditionsRoute(page, { variant: "stale" });
    await mockExternalContextRoute(page, { variant: "stale" });
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    const sources = page.getByTestId("recommendation-source");
    const allSources = await sources.allTextContents();

    // Deterministic, history, PIL, cohort should all still be present
    expect(allSources.some((s) => s === "Default guidance" || s === "Policy analysis")).toBe(true);
    expect(allSources).toContain("Customer history");
    expect(allSources).toContain("Policy Intelligence");
    expect(allSources).toContain("Cohort benchmark");
    expect(allSources.length).toBeGreaterThanOrEqual(4);
  });

  test("unavailable market + unavailable external do not break the page", async ({ page }) => {
    await mockMarketConditionsRoute(page, { variant: "unavailable" });
    await mockExternalContextRoute(page, { variant: "unavailable" });
    await page.goto("/customer/policies");

    await expect(
      page.getByRole("heading", { name: "Policy & Protections" }),
    ).toBeVisible();
    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // Other source types still render
    const sources = page.getByTestId("recommendation-source");
    const allSources = await sources.allTextContents();
    expect(allSources.length).toBeGreaterThanOrEqual(3);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// Mixed-signal freshness — one stale, one fresh
// ────────────────────────────────────────────────────────────────────────────

test.describe("customer policies — mixed signal freshness states", () => {
  test("market stale + external fresh renders both badges correctly", async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "enterprise" });
    await mockReceiptSummaryRoute(page);
    await mockMarketConditionsRoute(page, { variant: "stale" });
    await mockExternalContextRoute(page, { variant: "full" });
    await injectCustomerAuth(page);
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // Market badge: stale
    const marketBadge = page.getByTestId("freshness-badge-market-analysis");
    await expect(marketBadge).toBeVisible();
    await expect(marketBadge).toHaveText("Data may be outdated");

    // External badge: fresh (from EXTERNAL_CONTEXT_FULL which has fresh status)
    const extBadge = page.getByTestId("freshness-badge-external-context");
    await expect(extBadge).toBeVisible();
    await expect(extBadge).toHaveText("Live");

    // External recommendations should still render (fresh signal)
    const extCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-ext-']");
    const extCount = await extCards.count();
    expect(extCount).toBeGreaterThanOrEqual(1);
  });

  test("market fresh + external unavailable renders both badges correctly", async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockPolicyRoutes(page, { plan: "enterprise" });
    await mockReceiptSummaryRoute(page);
    await mockMarketConditionsRoute(page, { variant: "stressed" });
    await mockExternalContextRoute(page, { variant: "unavailable" });
    await injectCustomerAuth(page);
    await page.goto("/customer/policies");

    await expect(page.getByTestId("policy-recommendations")).toBeVisible();

    // Market badge: fresh (MARKET_STRESSED has fresh signal)
    const marketBadge = page.getByTestId("freshness-badge-market-analysis");
    await expect(marketBadge).toBeVisible();
    await expect(marketBadge).toHaveText("Live");

    // External badge: unavailable
    const extBadge = page.getByTestId("freshness-badge-external-context");
    await expect(extBadge).toBeVisible();
    await expect(extBadge).toHaveText("Signal unavailable");

    // External cards should be empty (unavailable = empty recs)
    const extCards = page
      .getByTestId("recommendation-cards")
      .locator("[data-testid^='recommendation-ext-']");
    await expect(extCards).toHaveCount(0);

    // Page remains coherent — recommendation section visible
    await expect(page.getByTestId("policy-recommendations")).toBeVisible();
  });
});
