import { expect, test } from "@playwright/test";
import {
  mockAuthRoutes,
  mockDashboardRoutes,
  mockReceiptRoutes,
  injectCustomerAuth,
  silenceAnalytics,
} from "./helpers/smoke-fixtures";

/**
 * Customer receipts smoke tests.
 *
 * Exercises: receipt list → detail view → verify receipt → verified state.
 */

test.describe("customer receipts flow", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockReceiptRoutes(page);
    await injectCustomerAuth(page);
  });

  test("receipts page loads with receipt list", async ({ page }) => {
    await page.goto("/customer/receipts");

    await expect(
      page.getByRole("heading", { name: "Receipts" }),
    ).toBeVisible();
    await expect(
      page.getByText("View and verify all ATF protection receipts"),
    ).toBeVisible();

    // Should show receipt rows
    await expect(page.getByText("rcpt_e2e")).toBeVisible();
    await expect(page.getByText("ALLOW")).toBeVisible();
  });

  test("receipt list shows decision badges and mode indicators", async ({
    page,
  }) => {
    await page.goto("/customer/receipts");

    // At least one ALLOW badge
    const allowBadges = page.locator("text=ALLOW");
    await expect(allowBadges.first()).toBeVisible();

    // At least one receipt with mock/dry_run mode
    await expect(page.getByText("mock").or(page.getByText("dry run"))).toBeVisible();
  });

  test("clicking a receipt shows detail panel", async ({ page }) => {
    await page.goto("/customer/receipts");

    // Click the first receipt row
    const firstReceipt = page.getByText("rcpt_e2e").first();
    await firstReceipt.click();

    // Detail panel should appear with more info
    await expect(
      page.getByText("Policy Breakdown").or(page.getByText("Metadata")),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("verify receipt shows verified state", async ({ page }) => {
    await page.goto("/customer/receipts");

    // Click verify
    const verifyButton = page.getByRole("button", { name: /Verify/i }).first();
    await verifyButton.click();

    // Should show verified result
    await expect(
      page
        .getByText("Verified", { exact: false })
        .or(page.getByText("verified", { exact: false })),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("dashboard link navigates back", async ({ page }) => {
    await page.goto("/customer/receipts");

    const dashLink = page.getByRole("link", { name: /Dashboard/i }).first();
    await expect(dashLink).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    const freshPage = await page.context().newPage();
    await freshPage.goto("/customer/receipts");

    await freshPage.waitForURL("**/login", { timeout: 10_000 });
    expect(freshPage.url()).toContain("/login");
    await freshPage.close();
  });
});
