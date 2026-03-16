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
  }) => {
    /* ── Step 4: Valid login ── */
    await page.goto("/admin/login");
    await page.getByLabel("Dashboard Key").fill(DASHBOARD_KEY);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should redirect to admin dashboard
    await page.waitForURL(/\/admin\/waitlist/, { timeout: 10_000 });
    expect(page.url()).toContain("/admin/waitlist");

    /* ── Step 5: Verify session cookie is set ── */
    const sessionCookie = await getAdminCookie(page);
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie!.httpOnly).toBe(true);
    expect(sessionCookie!.sameSite).toBe("Strict");
    expect(sessionCookie!.path).toBe("/admin");

    /* ── Step 6: Authenticated admin API request (security endpoint) ── */
    const apiResponse = await page.evaluate(async () => {
      const res = await fetch("/api/admin/security", {
        credentials: "include",
      });
      return { status: res.status, ok: res.ok };
    });
    expect(apiResponse.status).toBe(200);
    expect(apiResponse.ok).toBe(true);

    /* ── Step 7: Remember old cookie for post-logout test ── */
    const oldCookieValue = sessionCookie!.value;

    /* ── Step 8: Logout ── */
    const logoutResponse = await page.evaluate(async () => {
      const res = await fetch("/admin/logout", {
        method: "POST",
        credentials: "include",
      });
      return { status: res.status, redirected: res.redirected };
    });
    // Logout returns 303 redirect, fetch follows it
    expect(logoutResponse.status).toBeLessThan(500);

    /* ── Step 9: Verify admin cookie is cleared ── */
    const postLogoutCookie = await getAdminCookie(page);
    const cookieCleared =
      !postLogoutCookie || postLogoutCookie.value === "";
    expect(cookieCleared).toBe(true);

    /* ── Step 10: Old session/cookie no longer works ── */
    // Manually inject the old cookie and try the admin API
    await page.context().addCookies([
      {
        name: "admin_session",
        value: oldCookieValue,
        domain: "localhost",
        path: "/admin",
        httpOnly: true,
        sameSite: "Strict",
      },
    ]);

    const staleCookieResponse = await page.evaluate(async () => {
      const res = await fetch("/api/admin/security", {
        credentials: "include",
      });
      return { status: res.status };
    });
    // Revoked session → generic denial (404)
    expect(staleCookieResponse.status).toBe(404);

    /* ── Step 10b: Protected page also denied after logout ── */
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
    page,
    request,
  }) => {
    await page.goto("/admin/login");

    // Submit 5 invalid login attempts to trigger lockout
    for (let i = 0; i < 5; i++) {
      await page.getByLabel("Dashboard Key").fill(`wrong-key-${i}`);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForLoadState("networkidle");
      // No cookie should be set on any failure
      const cookie = await getAdminCookie(page);
      expect(cookie).toBeUndefined();
    }

    // 6th attempt should be rate-limited (even with valid key)
    const lockedResponse = await request.post("/admin/login", {
      form: { key: DASHBOARD_KEY },
      headers: { origin: "http://localhost:3000" },
      maxRedirects: 0,
    });
    // Locked out — generic 404
    expect(lockedResponse.status()).toBe(404);
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

    // Valid key during cooldown → denied
    const deniedResponse = await request.post("/admin/login", {
      form: { key: DASHBOARD_KEY },
      headers: { origin: "http://localhost:3000" },
      maxRedirects: 0,
    });
    expect(deniedResponse.status()).toBe(404);

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
    expect(lockedResponse.status()).toBe(404);

    // Advance time past 15-minute cooldown
    await advanceThrottleClock(request, 15 * 60 * 1000 + 1_000);

    // Now valid login should succeed
    await page.goto("/admin/login");
    await page.getByLabel("Dashboard Key").fill(DASHBOARD_KEY);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/admin\/waitlist/, { timeout: 10_000 });
    expect(page.url()).toContain("/admin/waitlist");

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

    // Valid login should now succeed
    await page.goto("/admin/login");
    await page.getByLabel("Dashboard Key").fill(DASHBOARD_KEY);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL(/\/admin\/waitlist/, { timeout: 10_000 });
    expect(page.url()).toContain("/admin/waitlist");

    const cookie = await getAdminCookie(page);
    expect(cookie).toBeDefined();
  });
});
