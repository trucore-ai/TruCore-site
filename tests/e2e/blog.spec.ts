import { expect, test } from "@playwright/test";

test("blog index loads", async ({ page }) => {
  await page.goto("/blog");

  await expect(page.getByRole("heading", { name: "TruCore Technical Posts" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Read post/i }).first()).toBeVisible();
});
