import { expect, test } from "@playwright/test";
import {
  mockAuthRoutes,
  mockDashboardRoutes,
  mockPolicyRoutes,
  injectCustomerAuth,
  silenceAnalytics,
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
