import { expect, test } from "@playwright/test";
import { silenceAnalytics } from "./helpers/smoke-fixtures";

test.describe("docs sidebar search", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
  });

  test("search input is visible on /docs", async ({ page }) => {
    await page.goto("/docs");

    const searchInput = page.getByLabel("Search docs");
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute("placeholder", "Search docs...");
  });

  test("typing 'getting started' filters to onboarding items", async ({ page }) => {
    await page.goto("/docs");

    const searchInput = page.getByLabel("Search docs");
    await searchInput.fill("getting started");

    const nav = page.getByRole("navigation", { name: "Documentation" });
    await expect(nav.getByRole("link", { name: "Getting Started" })).toBeVisible();
    // Unrelated items should be filtered out
    await expect(nav.getByRole("link", { name: "ATF CLI" })).not.toBeVisible();
  });

  test("typing 'cli' filters to CLI-related items", async ({ page }) => {
    await page.goto("/docs");

    const searchInput = page.getByLabel("Search docs");
    await searchInput.fill("cli");

    const nav = page.getByRole("navigation", { name: "Documentation" });
    await expect(nav.getByRole("link", { name: "ATF CLI" })).toBeVisible();
  });

  test("typing 'receipt' shows receipt-related items", async ({ page }) => {
    await page.goto("/docs");

    const searchInput = page.getByLabel("Search docs");
    await searchInput.fill("receipt");

    const nav = page.getByRole("navigation", { name: "Documentation" });
    await expect(nav.getByRole("link", { name: "Receipts & Trust", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Receipt Specification v1", exact: true })).toBeVisible();
  });

  test("typing 'quickstart' shows quickstart items", async ({ page }) => {
    await page.goto("/docs");

    const searchInput = page.getByLabel("Search docs");
    await searchInput.fill("quickstart");

    const nav = page.getByRole("navigation", { name: "Documentation" });
    await expect(nav.getByRole("link", { name: "Quickstart", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "5-Minute Quickstart", exact: true })).toBeVisible();
  });

  test("clicking a filtered result navigates to the correct page", async ({ page }) => {
    await page.goto("/docs");

    const searchInput = page.getByLabel("Search docs");
    await searchInput.fill("quickstart");

    const nav = page.getByRole("navigation", { name: "Documentation" });
    await nav.getByRole("link", { name: "Quickstart", exact: true }).click();

    await expect(page).toHaveURL("/docs/quickstart");
  });

  test("clearing search restores all sections", async ({ page }) => {
    await page.goto("/docs");

    const searchInput = page.getByLabel("Search docs");
    await searchInput.fill("cli");

    const nav = page.getByRole("navigation", { name: "Documentation" });
    // CLI visible after filter
    await expect(nav.getByRole("link", { name: "ATF CLI" })).toBeVisible();

    // Clear search
    await searchInput.fill("");

    // All sections should be restored — check items from different sections
    await expect(nav.getByRole("link", { name: "Getting Started" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "ATF CLI" })).toBeVisible();
  });

  test("no-match query shows 'No results found'", async ({ page }) => {
    await page.goto("/docs");

    const searchInput = page.getByLabel("Search docs");
    await searchInput.fill("xyznonexistent99");

    await expect(page.getByText("No results found.")).toBeVisible();
  });

  test("authenticated 'Customer Guides' section is hidden for public visitors", async ({ page }) => {
    await page.goto("/docs");

    const nav = page.getByRole("navigation", { name: "Documentation" });
    // The Customer Guides section title should not be visible to unauthenticated users
    await expect(nav.getByText("Customer Guides", { exact: true })).not.toBeVisible();
    // A specific authenticated page should not appear in nav
    await expect(nav.getByRole("link", { name: "Customer Guides Overview" })).not.toBeVisible();
  });
});
