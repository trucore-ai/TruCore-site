import { expect, test } from "@playwright/test";
import { injectCustomerAuth, silenceAnalytics } from "./helpers/smoke-fixtures";

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

/* ── DocsSearch scored-search component (mounted in docs layout) ── */

test.describe("docs scored search", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
  });

  test("DocsSearch input is visible on /docs", async ({ page }) => {
    await page.goto("/docs");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("placeholder", "Search docs");
  });

  test("typing a query shows scored dropdown results", async ({ page }) => {
    await page.goto("/docs");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    await input.fill("receipt");

    const listbox = page.getByRole("listbox", { name: "Docs search results" });
    await expect(listbox).toBeVisible();

    // Title-match results should appear (title match scores higher)
    await expect(listbox.getByRole("option", { name: /Receipts & Trust/i })).toBeVisible();
  });

  test("snippet/tag-aware search surfaces deeper matches", async ({ page }) => {
    await page.goto("/docs");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    // "tamper" only appears in contentSnippets for Receipts & Trust
    await input.fill("tamper");

    const listbox = page.getByRole("listbox", { name: "Docs search results" });
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole("option", { name: /Receipts & Trust/i })).toBeVisible();
  });

  test("keyboard ArrowDown / ArrowUp cycles active result", async ({ page }) => {
    await page.goto("/docs");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    await input.fill("cli");

    const listbox = page.getByRole("listbox", { name: "Docs search results" });
    await expect(listbox).toBeVisible();

    const options = listbox.getByRole("option");
    const count = await options.count();
    // First option should be active (aria-selected)
    await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");

    // Press ArrowDown to move to second option
    await input.press("ArrowDown");
    if (count > 1) {
      await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");
      await expect(options.nth(0)).toHaveAttribute("aria-selected", "false");
    }

    // Press ArrowUp to return to first
    await input.press("ArrowUp");
    await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");
  });

  test("Enter navigates to the active result", async ({ page }) => {
    await page.goto("/docs");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    await input.fill("quickstart");

    const listbox = page.getByRole("listbox", { name: "Docs search results" });
    await expect(listbox).toBeVisible();

    // The first result should be "Quickstart" (title match scores highest)
    const firstOption = listbox.getByRole("option").nth(0);
    await expect(firstOption).toHaveAttribute("aria-selected", "true");

    await input.press("Enter");
    await expect(page).toHaveURL(/\/docs\//);
  });

  test("clicking a result navigates correctly", async ({ page }) => {
    await page.goto("/docs");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    await input.fill("permit");

    const listbox = page.getByRole("listbox", { name: "Docs search results" });
    await expect(listbox).toBeVisible();

    // Click the first result
    await listbox.getByRole("option").nth(0).click();
    await expect(page).toHaveURL(/\/docs\//);
  });

  test("no-match query shows empty state", async ({ page }) => {
    await page.goto("/docs");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    await input.fill("xyznonexistent99");

    await expect(page.getByText("No matching docs found.")).toBeVisible();
  });

  test("Escape closes the dropdown", async ({ page }) => {
    await page.goto("/docs");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    await input.fill("receipt");

    const listbox = page.getByRole("listbox", { name: "Docs search results" });
    await expect(listbox).toBeVisible();

    await input.press("Escape");
    await expect(listbox).not.toBeVisible();
  });

  test("authenticated docs are excluded for public visitors", async ({ page }) => {
    await page.goto("/docs");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    // Search for terms that might match guide content
    await input.fill("key lifecycle");

    // The listbox may or may not appear, but no guide results should be present
    const guideOption = page.getByRole("option", { name: /Customer Guides/i });
    await expect(guideOption).not.toBeVisible();

    // Also try a broader guide-specific search
    await input.fill("webhooks debugging");
    const webhookGuide = page.getByRole("option", { name: /Webhook Setup/i });
    await expect(webhookGuide).not.toBeVisible();
  });
});

/* ── Authenticated DocsSearch (customer guides visible when logged in) ── */

test.describe("docs scored search — authenticated", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await injectCustomerAuth(page);
  });

  test("authenticated user sees guide results for 'key lifecycle'", async ({ page }) => {
    await page.goto("/docs/guide");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    await input.fill("key lifecycle");

    const listbox = page.getByRole("listbox", { name: "Docs search results" });
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole("option", { name: /API Key Lifecycle/i })).toBeVisible();
  });

  test("authenticated user sees guide results for 'reconcile'", async ({ page }) => {
    await page.goto("/docs/guide");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    await input.fill("reconcile");

    const listbox = page.getByRole("listbox", { name: "Docs search results" });
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole("option", { name: /Reconcile & State Recovery/i })).toBeVisible();
  });

  test("authenticated user sees guide results for 'rate limits'", async ({ page }) => {
    await page.goto("/docs/guide");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    await input.fill("rate limits");

    const listbox = page.getByRole("listbox", { name: "Docs search results" });
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole("option", { name: /Rate Limits & Recovery/i })).toBeVisible();
  });

  test("authenticated user sees guide results for 'webhooks'", async ({ page }) => {
    await page.goto("/docs/guide");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    await input.fill("webhooks");

    const listbox = page.getByRole("listbox", { name: "Docs search results" });
    await expect(listbox).toBeVisible();
    await expect(listbox.getByRole("option", { name: /Webhook Setup/i })).toBeVisible();
  });

  test("click-through navigation works for authenticated guide results", async ({ page }) => {
    await page.goto("/docs/guide");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    await input.fill("key lifecycle");

    const listbox = page.getByRole("listbox", { name: "Docs search results" });
    await expect(listbox).toBeVisible();

    await listbox.getByRole("option", { name: /API Key Lifecycle/i }).click();
    await expect(page).toHaveURL("/docs/guide/key-lifecycle");
  });

  test("public docs still appear in authenticated search", async ({ page }) => {
    await page.goto("/docs/guide");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    await input.fill("quickstart");

    const listbox = page.getByRole("listbox", { name: "Docs search results" });
    await expect(listbox).toBeVisible();
    // Multiple quickstart entries may match; just verify at least one public doc appears
    await expect(listbox.getByRole("option", { name: /Quickstart/i }).first()).toBeVisible();
  });

  test("public visitor on /docs still cannot see guide results", async ({ page }) => {
    // Use a fresh context without auth injection
    const freshContext = await page.context().browser()!.newContext();
    const freshPage = await freshContext.newPage();
    await silenceAnalytics(freshPage);

    await freshPage.goto("/docs");

    const input = freshPage.getByRole("combobox", { name: "Search documentation" });
    await input.fill("key lifecycle");

    const guideOption = freshPage.getByRole("option", { name: /API Key Lifecycle/i });
    await expect(guideOption).not.toBeVisible();

    await freshPage.close();
    await freshContext.close();
  });
});

/* ── Authenticated sidebar navigation (Customer Guides visibility) ── */

test.describe("docs sidebar nav — authenticated", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
    await injectCustomerAuth(page);
  });

  test("authenticated user sees Customer Guides section in sidebar", async ({ page }) => {
    await page.goto("/docs");

    const nav = page.getByRole("navigation", { name: "Documentation" });
    await expect(nav.getByText("Customer Guides", { exact: true })).toBeVisible();
  });

  test("authenticated user sees 'Your Guides' divider label", async ({ page }) => {
    await page.goto("/docs");

    await expect(page.getByText("Your Guides", { exact: true })).toBeVisible();
  });

  test("authenticated user sees representative guide links in sidebar", async ({ page }) => {
    await page.goto("/docs");

    const nav = page.getByRole("navigation", { name: "Documentation" });
    await expect(nav.getByRole("link", { name: "Customer Guides Overview" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "API Key Lifecycle" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Troubleshooting" })).toBeVisible();
  });

  test("clicking a guide link in sidebar navigates correctly", async ({ page }) => {
    await page.goto("/docs");

    const nav = page.getByRole("navigation", { name: "Documentation" });
    await nav.getByRole("link", { name: "API Key Lifecycle" }).click();

    await expect(page).toHaveURL("/docs/guide/key-lifecycle");
  });

  test("sidebar search placeholder reflects authenticated state", async ({ page }) => {
    await page.goto("/docs");

    const searchInput = page.locator("#docs-sidebar-search");
    await expect(searchInput).toHaveAttribute("placeholder", "Search docs & guides...");
  });

  test("scored search placeholder reflects authenticated state", async ({ page }) => {
    await page.goto("/docs");

    const input = page.getByRole("combobox", { name: "Search documentation" });
    await expect(input).toHaveAttribute("placeholder", "Search docs & guides");
  });

  test("public user does not see Your Guides divider or Customer Guides", async ({ page }) => {
    const freshContext = await page.context().browser()!.newContext();
    const freshPage = await freshContext.newPage();
    await silenceAnalytics(freshPage);

    await freshPage.goto("/docs");

    const nav = freshPage.getByRole("navigation", { name: "Documentation" });
    await expect(nav.getByText("Customer Guides", { exact: true })).not.toBeVisible();
    await expect(freshPage.getByText("Your Guides", { exact: true })).not.toBeVisible();

    // Sidebar search should have public placeholder
    const searchInput = freshPage.locator("#docs-sidebar-search");
    await expect(searchInput).toHaveAttribute("placeholder", "Search docs...");

    await freshPage.close();
    await freshContext.close();
  });
});
