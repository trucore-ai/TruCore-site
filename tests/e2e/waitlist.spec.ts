import { expect, test } from "@playwright/test";

test("waitlist form renders and accepts submission", async ({ page }) => {
  await page.goto("/");

  // Scroll to the real #waitlist section
  const waitlistSection = page.locator("#waitlist");
  await waitlistSection.scrollIntoViewIfNeeded();

  // Wait for the real WaitlistForm component to hydrate
  const form = page.getByTestId("waitlist-form");
  await expect(form).toBeVisible({ timeout: 15_000 });

  // Fill the real form fields
  await page.getByTestId("waitlist-email").fill("test+e2e@example.com");
  await page.getByTestId("waitlist-role").selectOption("Builder");
  await page.getByTestId("waitlist-usecase").fill("Deterministic E2E coverage");

  // Submit via the real button
  await page.getByTestId("waitlist-submit").click();

  // With WAITLIST_FALLBACK_MODE=memory (injected by playwright.config.ts),
  // the in-memory store ensures deterministic success without Postgres.
  const success = page.getByTestId("waitlist-success");
  await expect(success).toBeVisible({ timeout: 10_000 });
});

test("waitlist error does not leak internal details", async ({ page }) => {
  await page.goto("/");

  const waitlistSection = page.locator("#waitlist");
  await waitlistSection.scrollIntoViewIfNeeded();

  const form = page.getByTestId("waitlist-form");
  await expect(form).toBeVisible();

  // Submit with invalid email to trigger a validation error
  await page.getByTestId("waitlist-email").fill("not-an-email");
  await page.getByTestId("waitlist-submit").click();

  const error = page.getByTestId("waitlist-error");
  await expect(error).toBeVisible({ timeout: 10_000 });

  const text = await error.textContent();
  expect(text).toBeTruthy();
  // Must not leak internal DB/config details
  expect(text).not.toContain("POSTGRES_URL");
  expect(text).not.toContain("DATABASE_URL");
  expect(text).not.toContain("stack");
});
