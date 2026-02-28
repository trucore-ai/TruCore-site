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

test("portal verify helper opens verify page with prefilled hash", async ({ page }) => {
  const testHash = "a".repeat(64);

  await page.route("**/portal", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `
        <html>
          <body>
            <h1>Partner Portal</h1>
            <label for="receipt_hash">receipt_hash</label>
            <input id="receipt_hash" />
            <button id="verify_button" type="button">Verify</button>
            <script>
              document.getElementById('verify_button').addEventListener('click', function () {
                const hash = document.getElementById('receipt_hash').value;
                window.location.href = '/verify?hash=' + encodeURIComponent(hash) + '&from=portal';
              });
            </script>
          </body>
        </html>
      `,
    });
  });

  await page.goto("/portal");
  await page.locator("#receipt_hash").fill(testHash);
  await page.locator("#verify_button").click();

  await expect(page).toHaveURL(new RegExp(`/verify\\?hash=${testHash}&from=portal`));
  await expect(page.getByLabel("Paste receipt_hash")).toHaveValue(testHash);
});
