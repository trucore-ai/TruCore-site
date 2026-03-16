import { expect, test } from "@playwright/test";

test("demo live page loads and renders stream receipts", async ({ page }) => {
  await page.goto("/demo");

  await expect(page.getByRole("heading", { level: 1, name: "Demo Live" })).toBeVisible();

  await expect(page.getByTestId("receipt-json-toggle-0")).toBeVisible();
  await expect(page.getByTestId("receipt-verify-link-0")).toBeVisible();
});

test("demo live verify link navigates to verify with hash prefilled", async ({ page }) => {
  await page.goto("/demo");

  await page.getByTestId("receipt-verify-link-0").click();
  await expect(page).toHaveURL(/\/verify\?hash=[a-f0-9]{64}/);
  await expect(page.getByLabel("Paste receipt_hash")).toHaveValue(/[a-f0-9]{64}/);
});
