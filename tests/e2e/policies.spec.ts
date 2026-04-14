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
