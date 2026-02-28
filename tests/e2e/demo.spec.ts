import { expect, test } from "@playwright/test";

test("demo live page loads and renders stream receipts", async ({ page }) => {
  await page.goto("/demo");

  await expect(page.getByRole("heading", { level: 1, name: "Demo Live" })).toBeVisible();
  await expect(page.getByRole("button", { name: /View receipt JSON/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Verify" }).first()).toBeVisible();
});

test("demo live verify link navigates to verify with hash prefilled", async ({ page }) => {
  await page.goto("/demo");

  await page.getByRole("link", { name: "Verify", exact: true }).first().click();
  await expect(page).toHaveURL(/\/verify\?hash=[a-f0-9]{64}/);
  await expect(page.getByLabel("Paste receipt_hash")).toHaveValue(/[a-f0-9]{64}/);
});
