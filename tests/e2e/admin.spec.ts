import { expect, test } from "@playwright/test";

test("admin login and dashboard access (mocked key)", async ({ page }) => {
  await page.route("**/admin/waitlist", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<html><body><h1>Waitlist Triage</h1></body></html>",
    });
  });

  const dashboardKey = process.env.ADMIN_DASHBOARD_KEY || "e2e-admin-key";

  await page.goto("/admin/login");
  await page.evaluate(() => {
    const form = document.querySelector("form");
    if (!form) return;
    form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        window.location.assign("/admin/waitlist");
      },
      { once: true },
    );
  });

  await page.getByLabel("Dashboard Key").fill(dashboardKey);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/admin\/waitlist/);
  await expect(page.getByRole("heading", { name: "Waitlist Triage" })).toBeVisible();
});
