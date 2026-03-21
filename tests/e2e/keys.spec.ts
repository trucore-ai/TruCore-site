import { expect, test } from "@playwright/test";
import {
  mockAuthRoutes,
  mockDashboardRoutes,
  mockKeyRoutes,
  injectCustomerAuth,
  silenceAnalytics,
} from "./helpers/smoke-fixtures";

/**
 * Customer API key management smoke tests.
 *
 * Exercises: key list → create key → raw secret shown → revoke/rotate → UI updates.
 */

test.describe("customer keys flow", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockKeyRoutes(page);
    await injectCustomerAuth(page);
  });

  test("keys page loads with existing keys", async ({ page }) => {
    await page.goto("/customer/keys");

    await expect(
      page.getByRole("heading", { name: "API Keys" }),
    ).toBeVisible();
    await expect(
      page.getByText("Manage API keys for your integrations"),
    ).toBeVisible();

    // Should show existing key
    await expect(page.getByText("production-bot")).toBeVisible();
    await expect(page.getByText("active")).toBeVisible();
  });

  test("create new key shows raw secret once", async ({ page }) => {
    await page.goto("/customer/keys");

    // Open create section
    const createBtn = page.getByRole("button", { name: "Create" }).first();
    await createBtn.click();

    // Should show success with raw secret
    await expect(
      page.getByText("New API Key Created").or(
        page.getByText("This key will only be shown once"),
      ),
    ).toBeVisible({ timeout: 5_000 });

    // Raw secret text should be present
    await expect(
      page.getByText("atf_e2e_raw_secret", { exact: false }),
    ).toBeVisible();
  });

  test("revoke key shows confirmation and completes", async ({ page }) => {
    await page.goto("/customer/keys");

    // Click revoke on existing key
    const revokeBtn = page.getByRole("button", { name: "Revoke" }).first();
    await revokeBtn.click();

    // Confirm dialog
    const confirmBtn = page.getByRole("button", { name: "Confirm" });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // After revoke, UI should update (no error should appear)
    await expect(
      page.locator(".text-red-300").filter({ hasText: /error|fail/i }),
    ).not.toBeVisible({ timeout: 3_000 });
  });

  test("rotate key shows new raw secret", async ({ page }) => {
    await page.goto("/customer/keys");

    // Click rotate on existing key
    const rotateBtn = page.getByRole("button", { name: "Rotate" }).first();
    await rotateBtn.click();

    // Confirm
    const confirmBtn = page.getByRole("button", { name: "Confirm" });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Should show rotated secret
    await expect(
      page.getByText("Key Rotated").or(
        page.getByText("This key will only be shown once"),
      ),
    ).toBeVisible({ timeout: 5_000 });

    await expect(
      page.getByText("atf_e2e_rotated_secret", { exact: false }),
    ).toBeVisible();
  });

  test("dashboard link present on keys page", async ({ page }) => {
    await page.goto("/customer/keys");

    await expect(
      page.getByRole("link", { name: /Dashboard/i }),
    ).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    const freshPage = await page.context().newPage();
    await freshPage.goto("/customer/keys");

    await freshPage.waitForURL("**/login", { timeout: 10_000 });
    expect(freshPage.url()).toContain("/login");
    await freshPage.close();
  });
});
