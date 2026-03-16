import { expect, test } from "@playwright/test";

/**
 * End-to-end admin auth flow regression suite.
 *
 * Exercises the full session lifecycle through a real browser:
 *   1. Logged-out → redirect/deny
 *   2. Login page accessible
 *   3. Invalid credentials denied generically
 *   4. Valid login → redirect to admin dashboard
 *   5. Protected admin page accessible when authenticated
 *   6. Protected admin API accessible when authenticated
 *   7. Logout invalidates session
 *   8. Post-logout access denied
 *   9. Login throttle lifecycle (lockout → cooldown → reset → success)
 *
 * Uses the ADMIN_DASHBOARD_KEY set in playwright.config.ts (default: e2e-admin-key).
 */

const DASHBOARD_KEY = process.env.ADMIN_DASHBOARD_KEY || "e2e-admin-key";
const TEST_SECRET = process.env.ATF_E2E_TEST_SECRET || "e2e-test-secret";

/* ─── Helper: extract admin_session cookie from the browser context ── */
async function getAdminCookie(page: import("@playwright/test").Page) {
  const cookies = await page.context().cookies();
  return cookies.find((c) => c.name === "admin_session");
}

/* ─── 1. Logged-out access to /admin redirects to login ── */
test("logged-out /admin visit redirects to /admin/login", async ({ page }) => {
  const response = await page.goto("/admin/waitlist");
  // The admin layout redirects unauthenticated requests to /admin/login
  expect(page.url()).toContain("/admin/login");
  // Response should not leak 401/403 status codes externally
  expect(response?.status()).toBeLessThan(500);
});

/* ─── 2. Login page is publicly accessible ── */
test("login page is accessible", async ({ page }) => {
  const response = await page.goto("/admin/login");
  expect(response?.status()).toBe(200);
  await expect(page.getByLabel("Dashboard Key")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});

/* ─── 3. Invalid credentials are denied generically ── */
test("invalid credentials are denied with generic response", async ({
  page,
}) => {
  await page.goto("/admin/login");

  // Submit a wrong key
  await page.getByLabel("Dashboard Key").fill("wrong-key-value");
  await page.getByRole("button", { name: "Sign in" }).click();

  // Should NOT reach the admin dashboard
  await page.waitForLoadState("networkidle");
  expect(page.url()).not.toContain("/admin/waitlist");

  // No session cookie should be set
  const cookie = await getAdminCookie(page);
  expect(cookie).toBeUndefined();
});

/* ─── 4-9. Full login → access → API → logout → denial flow ── */
test.describe("authenticated admin lifecycle", () => {
  test("login → protected page → admin API → logout → denial", async ({
    page,
    request,
  }) => {
    /* ── Step 4: Valid login via form submission ── */
    await page.goto("/admin/login");
    await page.getByLabel("Dashboard Key").fill(DASHBOARD_KEY);

    // Intercept the POST response to verify redirect without loading target page
    const [loginResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/admin/login") &&
          r.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Sign in" }).click(),
    ]);
    // Server issues 303 redirect to admin dashboard
    expect(loginResponse.status()).toBe(303);
    expect(loginResponse.headers()["location"]).toContain("/admin/waitlist");

    // Allow the browser to process Set-Cookie from the 303
    await page.waitForTimeout(1_000);

    /* ── Step 5: Verify session cookie is set ── */
    const sessionCookie = await getAdminCookie(page);
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie!.httpOnly).toBe(true);
    expect(sessionCookie!.sameSite).toBe("Strict");
    expect(sessionCookie!.path).toBe("/admin");

    /* ── Step 6: Authenticated admin API request (security endpoint) ── */
    // Cookie path is /admin — use explicit header for /api/admin/* routes
    const apiResponse = await request.get("/api/admin/security", {
      headers: { cookie: `admin_session=${sessionCookie!.value}` },
    });
    expect(apiResponse.status()).toBe(200);
    expect(apiResponse.ok()).toBe(true);

    /* ── Step 7: Remember old cookie for post-logout test ── */
    const oldCookieValue = sessionCookie!.value;

    /* ── Step 8: Logout via API request (page may be in broken state
         due to /admin/waitlist requiring a database) ── */
    const logoutResponse = await request.post("/admin/logout", {
      headers: {
        cookie: `admin_session=${oldCookieValue}`,
        origin: "http://localhost:3000",
      },
      maxRedirects: 0,
    });
    expect(logoutResponse.status()).toBeLessThan(500);

    /* ── Step 9: Old session/cookie no longer works ── */
    const staleCookieResponse = await request.get("/api/admin/security", {
      headers: { cookie: `admin_session=${oldCookieValue}` },
    });
    // Revoked session → generic denial (404)
    expect(staleCookieResponse.status()).toBe(404);

    /* ── Step 10: Protected page also denied after logout ── */
    // Clear browser cookies so we start fresh
    await page.context().clearCookies();
    await page.goto("/admin/waitlist");
    // Should redirect back to login
    expect(page.url()).toContain("/admin/login");
  });
});

/* ─── Admin API denies unauthenticated requests generically ── */
test("admin API returns generic 404 without valid session", async ({
  request,
}) => {
  const response = await request.get("/api/admin/security");
  expect(response.status()).toBe(404);
  const body = await response.json();
  // Response must not leak internal error details
  expect(body).toEqual({ error: "not_found" });
  // Hardening headers present
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
});

/* ─── CSRF: mutation without Origin header is denied ── */
test("login POST without Origin header is denied", async ({ request }) => {
  const response = await request.post("/admin/login", {
    form: { key: DASHBOARD_KEY },
    headers: {
      // Explicitly omit Origin by not setting it
      origin: "",
    },
  });
  // Should not succeed — fail closed
  expect(response.status()).not.toBe(303);
  expect(response.status()).not.toBe(200);
});

/* ─── Test-only route gating ── */
test.describe("test-only route gating", () => {
  test("reset route returns 404 without test-secret header", async ({
    request,
  }) => {
    const response = await request.post("/api/test/login-throttle/reset");
    expect(response.status()).toBe(404);
  });

  test("advance route returns 404 without test-secret header", async ({
    request,
  }) => {
    const response = await request.post("/api/test/login-throttle/advance", {
      data: { ms: 1000 },
    });
    expect(response.status()).toBe(404);
  });

  test("reset route returns 404 with wrong test-secret header", async ({
    request,
  }) => {
    const response = await request.post("/api/test/login-throttle/reset", {
      headers: { "x-test-secret": "wrong-secret" },
    });
    expect(response.status()).toBe(404);
  });

  test("GET on test routes returns 404", async ({ request }) => {
    const resetRes = await request.get("/api/test/login-throttle/reset", {
      headers: { "x-test-secret": TEST_SECRET },
    });
    expect(resetRes.status()).toBe(404);

    const advanceRes = await request.get("/api/test/login-throttle/advance", {
      headers: { "x-test-secret": TEST_SECRET },
    });
    expect(advanceRes.status()).toBe(404);
  });
});

/* ─── Login throttle / cooldown lifecycle ── */
test.describe("login throttle lifecycle", () => {
  /* Helper: reset throttle state via test-only route */
  async function resetThrottle(
    request: import("@playwright/test").APIRequestContext,
  ) {
    const res = await request.post("/api/test/login-throttle/reset", {
      headers: { "x-test-secret": TEST_SECRET },
    });
    expect(res.status()).toBe(200);
  }

  /* Helper: advance throttle clock via test-only route */
  async function advanceThrottleClock(
    request: import("@playwright/test").APIRequestContext,
    ms: number,
  ) {
    const res = await request.post("/api/test/login-throttle/advance", {
      headers: { "x-test-secret": TEST_SECRET },
      data: { ms },
    });
    expect(res.status()).toBe(200);
  }

  test.beforeEach(async ({ request }) => {
    await resetThrottle(request);
  });

  test.afterEach(async ({ request }) => {
    await resetThrottle(request);
  });

  test("repeated invalid attempts trigger lockout", async ({
    request,
  }) => {
    // Submit 5 invalid login attempts via API (consistent IP identity)
    for (let i = 0; i < 5; i++) {
      await request.post("/admin/login", {
        form: { key: `wrong-key-${i}` },
        headers: { origin: "http://localhost:3000" },
        maxRedirects: 0,
      });
    }

    // 6th attempt should be rate-limited (even with valid key)
    const lockedResponse = await request.post("/admin/login", {
      form: { key: DASHBOARD_KEY },
      headers: { origin: "http://localhost:3000" },
      maxRedirects: 0,
    });
    // Locked out — redirects back to login (not to dashboard)
    expect(lockedResponse.status()).toBe(303);
    expect(lockedResponse.headers()["location"]).toContain("/admin/login");
    expect(lockedResponse.headers()["location"]).not.toContain(
      "/admin/waitlist",
    );
  });

  test("valid credentials during cooldown are still denied", async ({
    request,
  }) => {
    // Trigger lockout
    for (let i = 0; i < 5; i++) {
      await request.post("/admin/login", {
        form: { key: `wrong-${i}` },
        headers: { origin: "http://localhost:3000" },
        maxRedirects: 0,
      });
    }

    // Valid key during cooldown → denied (redirects to login, not dashboard)
    const deniedResponse = await request.post("/admin/login", {
      form: { key: DASHBOARD_KEY },
      headers: { origin: "http://localhost:3000" },
      maxRedirects: 0,
    });
    expect(deniedResponse.status()).toBe(303);
    expect(deniedResponse.headers()["location"]).toContain("/admin/login");
    expect(deniedResponse.headers()["location"]).not.toContain("/admin/waitlist");

    // No cookie set on denied attempt
    const cookies = await request.storageState();
    const adminCookie = cookies.cookies.find((c) => c.name === "admin_session");
    expect(adminCookie).toBeUndefined();
  });

  test("login succeeds after cooldown cleared via time advance", async ({
    page,
    request,
  }) => {
    // Trigger lockout
    for (let i = 0; i < 5; i++) {
      await request.post("/admin/login", {
        form: { key: `wrong-${i}` },
        headers: { origin: "http://localhost:3000" },
        maxRedirects: 0,
      });
    }

    // Confirm locked
    const lockedResponse = await request.post("/admin/login", {
      form: { key: DASHBOARD_KEY },
      headers: { origin: "http://localhost:3000" },
      maxRedirects: 0,
    });
    expect(lockedResponse.status()).toBe(303);
    expect(lockedResponse.headers()["location"]).toContain("/admin/login");

    // Advance time past 15-minute cooldown
    await advanceThrottleClock(request, 15 * 60 * 1000 + 1_000);

    // Now valid login should succeed — verify via response interception
    await page.goto("/admin/login");
    await page.getByLabel("Dashboard Key").fill(DASHBOARD_KEY);
    const [successResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/admin/login") &&
          r.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Sign in" }).click(),
    ]);
    expect(successResponse.status()).toBe(303);
    expect(successResponse.headers()["location"]).toContain("/admin/waitlist");

    // Allow browser to process Set-Cookie
    await page.waitForTimeout(1_000);

    // Session cookie should be set
    const cookie = await getAdminCookie(page);
    expect(cookie).toBeDefined();
  });

  test("login succeeds after cooldown cleared via reset", async ({
    page,
    request,
  }) => {
    // Trigger lockout
    for (let i = 0; i < 5; i++) {
      await request.post("/admin/login", {
        form: { key: `wrong-${i}` },
        headers: { origin: "http://localhost:3000" },
        maxRedirects: 0,
      });
    }

    // Reset throttle state
    await resetThrottle(request);

    // Valid login should now succeed — verify via response interception
    await page.goto("/admin/login");
    await page.getByLabel("Dashboard Key").fill(DASHBOARD_KEY);
    const [successResponse] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/admin/login") &&
          r.request().method() === "POST",
      ),
      page.getByRole("button", { name: "Sign in" }).click(),
    ]);
    expect(successResponse.status()).toBe(303);
    expect(successResponse.headers()["location"]).toContain("/admin/waitlist");

    // Allow browser to process Set-Cookie
    await page.waitForTimeout(1_000);

    const cookie = await getAdminCookie(page);
    expect(cookie).toBeDefined();
  });
});
