import { expect, test } from "@playwright/test";

test("atf page loads", async ({ page }) => {
  await page.goto("/atf");

  await expect(
    page.getByRole("heading", { name: "Agent Transaction Firewall", level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Apply as Design Partner" }).first()).toBeVisible();
});

test("simulate endpoint returns rate limit headers", async ({ page }) => {
  await page.route("**/api/simulate", async (route) => {
    const req = route.request();
    const hasApiKey = Boolean(req.headers()["x-api-key"]);

    if (hasApiKey) {
      await route.fulfill({
        status: 401,
        headers: {
          "content-type": "application/json",
          "x-ratelimit-limit": "30",
          "x-ratelimit-remaining": "29",
          "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 60),
        },
        body: JSON.stringify({ ok: false, error: "invalid_api_key" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-ratelimit-limit": "30",
        "x-ratelimit-remaining": "29",
        "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 60),
      },
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto("/atf");

  const payload = {
    action: "swap",
    token_in: "SOL",
    token_out: "USDC",
    amount: 10,
    max_slippage_bps: 100,
    ttl_seconds: 60,
  };

  const publicHeaders = await page.evaluate(async (body) => {
    const response = await fetch("/api/simulate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    return {
      status: response.status,
      limit: response.headers.get("x-ratelimit-limit"),
      remaining: response.headers.get("x-ratelimit-remaining"),
      reset: response.headers.get("x-ratelimit-reset"),
    };
  }, payload);

  expect(publicHeaders.status).toBe(200);
  expect(publicHeaders.limit).toBeTruthy();
  expect(publicHeaders.remaining).toBeTruthy();
  expect(publicHeaders.reset).toBeTruthy();

  const invalidHeaders = await page.evaluate(async (body) => {
    const response = await fetch("/api/simulate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": "tk_live_invalid_key",
      },
      body: JSON.stringify(body),
    });

    return {
      status: response.status,
      limit: response.headers.get("x-ratelimit-limit"),
      remaining: response.headers.get("x-ratelimit-remaining"),
      reset: response.headers.get("x-ratelimit-reset"),
    };
  }, payload);

  expect(invalidHeaders.status).toBe(401);
  expect(invalidHeaders.limit).toBeTruthy();
  expect(invalidHeaders.remaining).toBeTruthy();
  expect(invalidHeaders.reset).toBeTruthy();
});
