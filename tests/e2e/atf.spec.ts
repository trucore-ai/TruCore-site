import { expect, test } from "@playwright/test";

test("atf page loads", async ({ page }) => {
  await page.goto("/atf");

  await expect(
    page.getByRole("heading", { name: "Agent Transaction Firewall", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Apply as Design Partner" }).first()).toBeVisible();
});
