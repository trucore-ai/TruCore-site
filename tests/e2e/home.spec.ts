import { expect, test } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/TruCore/i);
  await expect(page.getByText("Operational Controls", { exact: true })).toBeVisible();
});
