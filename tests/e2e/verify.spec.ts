import { expect, test } from "@playwright/test";

test("receipts viewer opens verification kit with prefilled hash", async ({ page }) => {
  await page.goto("/receipts");

  await expect(page.getByRole("heading", { level: 1, name: /Receipts Explorer/i })).toBeVisible();

  const receiptJson = await page.locator("pre").first().innerText();
  const hashMatch = receiptJson.match(/"receipt_hash"\s*:\s*"([a-f0-9]{64})"/i);
  expect(hashMatch).toBeTruthy();

  const receiptHash = hashMatch?.[1] ?? "";

  await page.getByRole("link", { name: "Open Verification Kit" }).click();
  await expect(page).toHaveURL(/\/verify\?hash=/);
  await expect(page.getByLabel("Paste receipt_hash")).toHaveValue(receiptHash);
});

test("verify utility validates receipt hash format and deterministic recompute", async ({ page }) => {
  await page.goto("/receipts");

  const receiptJson = await page.locator("pre").first().innerText();
  const hashMatch = receiptJson.match(/"receipt_hash"\s*:\s*"([a-f0-9]{64})"/i);
  expect(hashMatch).toBeTruthy();

  const receiptHash = hashMatch?.[1] ?? "";

  await page.goto("/verify");

  await page.getByLabel("Paste receipt_hash").fill(receiptHash);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page.getByText("format_valid: true")).toBeVisible();

  await page.getByLabel("Optional, paste full receipt JSON").fill(receiptJson);
  await page.getByRole("button", { name: "Verify" }).click();

  await expect(page.getByText("format_valid: true")).toBeVisible();
  await expect(page.getByText("matches: true")).toBeVisible();
});

test("verify utility shows unsupported receipt version message", async ({ page }) => {
  await page.goto("/verify");

  await page.getByLabel("Paste receipt_hash").fill("a".repeat(64));
  await page.getByLabel("Optional, paste full receipt JSON").fill('{"version":"999","note":"future"}');
  await page.getByRole("button", { name: "Verify" }).click();

  await expect(page.getByText(/Unsupported receipt format version/i)).toBeVisible();
});

test("verify utility can fetch and verify receipt hash signature", async ({ page }) => {
  await page.goto("/receipts");

  const receiptJson = await page.locator("pre").first().innerText();
  const hashMatch = receiptJson.match(/"receipt_hash"\s*:\s*"([a-f0-9]{64})"/i);
  expect(hashMatch).toBeTruthy();

  const receiptHash = hashMatch?.[1] ?? "";

  await page.goto(`/verify?hash=${encodeURIComponent(receiptHash)}`);

  await expect(page.getByLabel("Paste receipt_hash")).toHaveValue(receiptHash);
  await page.getByRole("button", { name: "Fetch signature for this hash" }).click();

  await expect(page.getByText("Signature status: Verified ✅")).toBeVisible();
  await expect(page.getByText("Public key (base64)")).toBeVisible();
  await expect(page.getByText("Signature (base64)").first()).toBeVisible();
});

test("verify utility shows signature unavailable state", async ({ page }) => {
  await page.route("**/api/receipt-signing-key", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        available: false,
        public_key: null,
        alg: "Ed25519",
        encoding: "base64",
      }),
      headers: {
        "Cache-Control": "no-store",
      },
    });
  });

  await page.goto("/verify");
  await expect(page.getByText("Signature not configured (demo mode).")).toBeVisible();
});
