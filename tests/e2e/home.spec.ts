import { expect, test } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/TruCore/i);
  await expect(page.getByText("Operational Controls", { exact: true })).toBeVisible();
});

test("homepage nav includes receipts link", async ({ page }) => {
  await page.goto("/");

  const receiptsLink = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Receipts" });
  await expect(receiptsLink).toBeVisible();
  await expect(receiptsLink).toHaveAttribute("href", "/receipts");
});

test("homepage honors reduced motion media preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-reduce-motion", "true");
});
