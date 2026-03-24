import { expect, test } from "@playwright/test";
import {
  mockAuthRoutes,
  mockDashboardRoutes,
  mockReceiptRoutes,
  injectCustomerAuth,
  silenceAnalytics,
} from "./helpers/smoke-fixtures";

/**
 * Customer onboarding smoke tests.
 *
 * Exercises: dashboard load → generate sample → simulate → execute → receipt.
 * Uses route interception for all ATF backend calls.
 */

test.describe("customer onboarding flow", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockAuthRoutes(page, { emailVerified: true });
    await mockDashboardRoutes(page);
    await mockReceiptRoutes(page);
    await injectCustomerAuth(page);
  });

  test("authenticated user lands on dashboard", async ({ page }) => {
    await page.goto("/customer/dashboard");

    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page.getByText("e2e@test.trucore.xyz")).toBeVisible();
    await expect(page.getByText("free plan")).toBeVisible();
  });

  test("dashboard shows account details and API keys section", async ({
    page,
  }) => {
    await page.goto("/customer/dashboard");

    await expect(page.getByText("Account details")).toBeVisible();
    await expect(page.getByText("Tenant ID")).toBeVisible();
    await expect(page.getByText("API Keys")).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Manage API Keys/i }),
    ).toBeVisible();
  });

  test("onboarding wizard shows step indicators", async ({ page }) => {
    await page.goto("/customer/dashboard");

    // Onboarding section
    await expect(
      page.getByText("Run Your First Protected Trade"),
    ).toBeVisible();
    await expect(page.getByText("Generate", { exact: true })).toBeVisible();
    await expect(page.getByText("Simulate", { exact: true })).toBeVisible();
    await expect(page.getByText("Execute", { exact: true })).toBeVisible();
  });

  test("generate sample trade in onboarding", async ({ page }) => {
    await page.goto("/customer/dashboard");

    await page
      .getByRole("button", { name: "Generate Sample Trade" })
      .click();

    // Sample intent should appear
    await expect(page.getByText("Sample Intent")).toBeVisible();
    // Simulate button should now be available
    await expect(
      page.getByRole("button", { name: "Simulate Protection" }),
    ).toBeVisible();
  });

  test("full onboarding: generate → simulate → execute", async ({ page }) => {
    // Set up activation mock to progress through steps
    const stepState = { steps_completed: [] as string[], onboarding_completed: false };

    await page.route("**/dashboard/activation", (route) => {
      if (route.request().method() === "POST") {
        const body = route.request().postDataJSON();
        if (body?.step) {
          stepState.steps_completed.push(body.step);
        }
        return route.fulfill({
          status: 200,
          json: { ...stepState, first_receipt_id: null },
        });
      }
      return route.fulfill({
        status: 200,
        json: { ...stepState, first_receipt_id: null },
      });
    });

    await page.goto("/customer/dashboard");

    // Step 1: Generate
    await page
      .getByRole("button", { name: "Generate Sample Trade" })
      .click();
    await expect(page.getByText("Sample Intent")).toBeVisible();

    // Step 2: Simulate
    await page
      .getByRole("button", { name: "Simulate Protection" })
      .click();
    await expect(page.getByText("Policy Evaluation")).toBeVisible();
    await expect(page.getByText("ALLOW")).toBeVisible();

    // Step 3: Execute
    await page
      .getByRole("button", { name: "Execute Sample Trade" })
      .click();
    await expect(page.getByText("Trade Receipt")).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    // Don't inject auth — start fresh
    const freshPage = await page.context().newPage();
    await freshPage.goto("/customer/dashboard");

    // Client-side redirect to /login
    await freshPage.waitForURL("**/login", { timeout: 10_000 });
    expect(freshPage.url()).toContain("/login");
    await freshPage.close();
  });

  test("sign out button clears session", async ({ page }) => {
    await page.goto("/customer/dashboard");

    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();

    // Should redirect to login
    await page.waitForURL("**/login");
    expect(page.url()).toContain("/login");
  });
});
