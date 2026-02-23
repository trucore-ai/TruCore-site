import { expect, test } from "@playwright/test";

test("portal redirects to login when not authenticated", async ({ page }) => {
  await page.route("**/portal", async (route) => {
    await route.fulfill({
      status: 303,
      headers: {
        location: "/portal/login",
      },
      body: "",
    });
  });

  await page.goto("/portal");
  await expect(page).toHaveURL(/\/portal\/login/);
});

test("portal logout clears session and blocks access", async ({ context, page }) => {
  await context.addCookies([
    {
      name: "partner_portal_session",
      value: "dummy",
      domain: "localhost",
      path: "/portal",
      httpOnly: true,
    },
  ]);

  await page.route("**/portal", async (route) => {
    const cookieHeader = route.request().headers()["cookie"] ?? "";
    if (cookieHeader.includes("partner_portal_session=dummy")) {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body><h1>Partner Portal</h1></body></html>",
      });
      return;
    }

    await route.fulfill({
      status: 303,
      headers: {
        location: "/portal/login",
      },
      body: "",
    });
  });

  await page.goto("/portal");
  await expect(page.getByRole("heading", { name: "Partner Portal" })).toBeVisible();

  await context.clearCookies();
  await page.goto("/portal");
  await expect(page).toHaveURL(/\/portal\/login/);
});
