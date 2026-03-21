import { expect, test } from "@playwright/test";
import { mockSandboxRoutes, silenceAnalytics } from "./helpers/smoke-fixtures";

/**
 * Public /try flow — no login required.
 *
 * Exercises: generate sample → simulate protection → receipt appears → signup CTA.
 */

test.describe("public try flow", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await mockSandboxRoutes(page);
  });

  test("page loads with correct heading and step 1 button", async ({ page }) => {
    await page.goto("/try");
    await expect(page.getByRole("heading", { name: "Try ATF" })).toBeVisible();
    await expect(page.getByText("Public Sandbox")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Try Sample Trade" }),
    ).toBeVisible();
  });

  test("generate sample → simulate → receipt and signup CTA appear", async ({
    page,
  }) => {
    await page.goto("/try");

    // Step 1: Generate sample
    await page.getByRole("button", { name: "Try Sample Trade" }).click();
    await expect(page.getByText("Sample Intent")).toBeVisible();
    await expect(page.getByText("Sample loaded ✓")).toBeVisible();

    // Step 2: Simulate protection
    await expect(
      page.getByRole("button", { name: "Simulate Protection" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Simulate Protection" }).click();
    await expect(page.getByText("Protection complete ✓")).toBeVisible();

    // Step 3: Results — decision, policy breakdown, receipt
    await expect(page.getByText("Results")).toBeVisible();
    await expect(page.getByText("ALLOW")).toBeVisible();
    await expect(page.getByText("Policy Breakdown")).toBeVisible();
    await expect(page.getByText("Receipt")).toBeVisible();

    // Signup CTA
    await expect(
      page.getByRole("link", { name: "Create Account" }),
    ).toBeVisible();
    const ctaHref = await page
      .getByRole("link", { name: "Create Account" })
      .getAttribute("href");
    expect(ctaHref).toBe("/signup");
  });

  test("start over resets flow to step 1", async ({ page }) => {
    await page.goto("/try");

    // Complete the flow
    await page.getByRole("button", { name: "Try Sample Trade" }).click();
    await expect(page.getByText("Sample loaded ✓")).toBeVisible();
    await page.getByRole("button", { name: "Simulate Protection" }).click();
    await expect(page.getByText("Protection complete ✓")).toBeVisible();

    // Reset
    await page.getByRole("button", { name: "Start over" }).click();
    await expect(
      page.getByRole("button", { name: "Try Sample Trade" }),
    ).toBeVisible();
  });
});
