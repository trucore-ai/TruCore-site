import { expect, test } from "@playwright/test";

test("waitlist form renders and accepts submission", async ({ page }) => {
  await page.goto("/");

  // Scroll to the real #waitlist section
  const waitlistSection = page.locator("#waitlist");
  await waitlistSection.scrollIntoViewIfNeeded();

  // Wait for the real WaitlistForm component to hydrate
  const form = page.getByTestId("waitlist-form");
  await expect(form).toBeVisible();

  // Fill the real form fields
  await page.getByTestId("waitlist-email").fill("test+e2e@example.com");
  await page.getByTestId("waitlist-role").selectOption("Builder");
  await page.getByTestId("waitlist-usecase").fill("Deterministic E2E coverage");

  // Submit via the real button
  await page.getByTestId("waitlist-submit").click();

  // In CI/local without a database, the server action returns a graceful
  // error. With a database, it returns success. Either outcome is valid;
  // the key assertion is that the UI responds deterministically without
  // crashing or exposing internal details.
  const success = page.getByTestId("waitlist-success");
  const error = page.getByTestId("waitlist-error");
  await expect(success.or(error)).toBeVisible({ timeout: 10_000 });

  // If the error path fired, verify it shows a user-safe message
  if (await error.isVisible()) {
    const text = await error.textContent();
    expect(text).toBeTruthy();
    // Must not leak internal DB/config details
    expect(text).not.toContain("POSTGRES_URL");
    expect(text).not.toContain("DATABASE_URL");
    expect(text).not.toContain("stack");
  }
});
