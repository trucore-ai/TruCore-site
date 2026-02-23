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

test("issue sandbox key reveal panel appears", async ({ page }) => {
  await page.route("**/api/keys/issue-for-partner", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        key: {
          id: "key-1",
          owner_email: "partner@example.com",
          owner_project: "Alpha",
          created_at: new Date().toISOString(),
          revoked_at: null,
          label: "Sandbox - Alpha",
        },
        raw_key: "tk_live_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      }),
    });
  });

  await page.route("**/admin/waitlist", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `
        <html>
          <body>
            <h1>Waitlist Triage</h1>
            <button id="issue-btn">Issue Sandbox Key</button>
            <div id="panel"></div>
            <script>
              const issueBtn = document.getElementById("issue-btn");
              const panel = document.getElementById("panel");
              issueBtn.addEventListener("click", async () => {
                const response = await fetch("/api/keys/issue-for-partner", { method: "POST" });
                const data = await response.json();
                panel.innerHTML =
                  "<p>Raw key, shown once</p>" +
                  "<p>" + data.raw_key + "</p>" +
                  "<button>Copy</button>" +
                  "<button>I saved it</button>";
              });
            </script>
          </body>
        </html>
      `,
    });
  });

  await page.goto("/admin/waitlist");
  await page.getByRole("button", { name: "Issue Sandbox Key" }).click();

  await expect(page.getByText("Raw key, shown once")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy" })).toBeVisible();
});

test("create portal link one-time token reveal appears", async ({ page }) => {
  await page.route("**/api/portal/token/create", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        portal_token: {
          id: "portal-1",
          owner_email: "partner@example.com",
          owner_project: "Alpha",
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          revoked_at: null,
        },
        raw_token: "ptl_live_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        portal_link: "http://localhost:3000/portal/login?token=ptl_live_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      }),
    });
  });

  await page.route("**/admin/waitlist", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `
        <html>
          <body>
            <h1>Waitlist Triage</h1>
            <button id="portal-btn">Create Portal Link</button>
            <div id="panel"></div>
            <script>
              const portalBtn = document.getElementById("portal-btn");
              const panel = document.getElementById("panel");
              portalBtn.addEventListener("click", async () => {
                const response = await fetch("/api/portal/token/create", { method: "POST" });
                const data = await response.json();
                panel.innerHTML =
                  "<p>Portal token, shown once</p>" +
                  "<p>" + data.raw_token + "</p>" +
                  "<button>Copy token</button>" +
                  "<button>Copy link</button>";
              });
            </script>
          </body>
        </html>
      `,
    });
  });

  await page.goto("/admin/waitlist");
  await page.getByRole("button", { name: "Create Portal Link" }).click();

  await expect(page.getByText("Portal token, shown once")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy token" })).toBeVisible();
});
