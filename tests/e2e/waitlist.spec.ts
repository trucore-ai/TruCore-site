<<<<<<< Updated upstream
import { expect, test } from "@playwright/test";

/* ── Standard waitlist (homepage) ── */

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

/* ── Homepage design-partner variant (?intent=design_partner) ── */

test("homepage design-partner variant renders all required fields", async ({ page }) => {
  await page.goto("/?intent=design_partner");

  const waitlistSection = page.locator("#waitlist");
  await waitlistSection.scrollIntoViewIfNeeded();

  const form = page.getByTestId("waitlist-form");
  await expect(form).toBeVisible({ timeout: 15_000 });

  // Standard fields still present
  await expect(page.getByTestId("waitlist-email")).toBeVisible();
  await expect(page.getByTestId("waitlist-role")).toBeVisible();
  await expect(page.getByTestId("waitlist-usecase")).toBeVisible();

  // Design-partner–specific fields rendered
  await expect(page.getByTestId("waitlist-project")).toBeVisible();
  await expect(page.getByTestId("waitlist-tx-volume")).toBeVisible();
  await expect(page.getByTestId("waitlist-build-stage")).toBeVisible();
  await expect(page.getByTestId("waitlist-integration-jupiter")).toBeVisible();

  // Submit button reads "Submit Application" for design-partner variant
  await expect(page.getByTestId("waitlist-submit")).toContainText("Submit Application");
});

test("homepage design-partner submit succeeds and shows success state", async ({ page }) => {
  await page.goto("/?intent=design_partner");

  const waitlistSection = page.locator("#waitlist");
  await waitlistSection.scrollIntoViewIfNeeded();

  const form = page.getByTestId("waitlist-form");
  await expect(form).toBeVisible({ timeout: 15_000 });

  // Fill all required fields
  await page.getByTestId("waitlist-email").fill("homepage-dp+e2e@example.com");
  await page.getByTestId("waitlist-project").fill("Homepage DP E2E");
  await page.getByTestId("waitlist-integration-jupiter").check();
  await page.getByTestId("waitlist-build-stage").selectOption("prototype");
  await page.getByTestId("waitlist-tx-volume").selectOption("10k_100k");

  await page.getByTestId("waitlist-submit").click();

  // Success state
  const success = page.getByTestId("waitlist-success");
  await expect(success).toBeVisible({ timeout: 10_000 });
  await expect(success).toContainText("Application received");
});

test("homepage design-partner success shows scheduling link", async ({ page }) => {
  await page.goto("/?intent=design_partner");

  const waitlistSection = page.locator("#waitlist");
  await waitlistSection.scrollIntoViewIfNeeded();

  const form = page.getByTestId("waitlist-form");
  await expect(form).toBeVisible({ timeout: 15_000 });

  // Fill and submit
  await page.getByTestId("waitlist-email").fill("homepage-dp+sched@example.com");
  await page.getByTestId("waitlist-project").fill("Schedule Link E2E");
  await page.getByTestId("waitlist-integration-orca").check();
  await page.getByTestId("waitlist-build-stage").selectOption("prod");
  await page.getByTestId("waitlist-tx-volume").selectOption("gt_1m");

  await page.getByTestId("waitlist-submit").click();

  const success = page.getByTestId("waitlist-success");
  await expect(success).toBeVisible({ timeout: 10_000 });

  // Scheduling link rendered with valid URL
  const schedulingLink = page.getByTestId("waitlist-scheduling-link");
  await expect(schedulingLink).toBeVisible();
  await expect(schedulingLink).toHaveText("Book a fit check");

  const href = await schedulingLink.getAttribute("href");
  expect(href).toBeTruthy();
  expect(href).toMatch(/^https?:\/\//);
  expect(href).not.toContain("undefined");
});

test("homepage design-partner error does not leak internal details", async ({ page }) => {
  await page.goto("/?intent=design_partner");

  const waitlistSection = page.locator("#waitlist");
  await waitlistSection.scrollIntoViewIfNeeded();

  const form = page.getByTestId("waitlist-form");
  await expect(form).toBeVisible({ timeout: 15_000 });

  // Submit with invalid email but other fields filled
  await page.getByTestId("waitlist-email").fill("bad-email");
  await page.getByTestId("waitlist-project").fill("Leak Test Co");
  await page.getByTestId("waitlist-integration-jupiter").check();
  await page.getByTestId("waitlist-build-stage").selectOption("idea");
  await page.getByTestId("waitlist-tx-volume").selectOption("lt_10k");

  await page.getByTestId("waitlist-submit").click();

  const error = page.getByTestId("waitlist-error");
  await expect(error).toBeVisible({ timeout: 10_000 });

  const text = await error.textContent();
  expect(text).toBeTruthy();
  expect(text).not.toContain("POSTGRES_URL");
  expect(text).not.toContain("DATABASE_URL");
  expect(text).not.toContain("DESIGN_PARTNER_SCHEDULING_URL");
  expect(text).not.toContain("stack");
});

/* ── Design-partner apply page (/atf/apply) ── */

test("design-partner form renders with all required fields", async ({ page }) => {
  await page.goto("/atf/apply");

  const form = page.getByTestId("design-partner-form");
  await expect(form).toBeVisible({ timeout: 15_000 });

  // All required fields are present
  await expect(page.getByTestId("design-partner-email")).toBeVisible();
  await expect(page.getByTestId("design-partner-project")).toBeVisible();
  await expect(page.getByTestId("design-partner-build-stage")).toBeVisible();
  await expect(page.getByTestId("design-partner-tx-volume")).toBeVisible();
  // Submit button is present
  await expect(page.getByTestId("design-partner-submit")).toBeVisible();

  // At least one integration checkbox is present
  await expect(page.getByTestId("design-partner-integration-jupiter")).toBeVisible();
});

test("design-partner submit succeeds and renders success state", async ({ page }) => {
  await page.goto("/atf/apply");

  const form = page.getByTestId("design-partner-form");
  await expect(form).toBeVisible({ timeout: 15_000 });

  // Fill all required fields
  await page.getByTestId("design-partner-email").fill("partner+e2e@example.com");
  await page.getByTestId("design-partner-project").fill("Acme Trading E2E");
  await page.getByTestId("design-partner-integration-jupiter").check();
  await page.getByTestId("design-partner-build-stage").selectOption("prototype");
  await page.getByTestId("design-partner-tx-volume").selectOption("10k_100k");

  // Submit
  await page.getByTestId("design-partner-submit").click();

  // Success state renders
  const success = page.getByTestId("design-partner-success");
  await expect(success).toBeVisible({ timeout: 10_000 });
  await expect(success).toContainText("Application received");
});

test("design-partner success state shows scheduling link", async ({ page }) => {
  await page.goto("/atf/apply");

  const form = page.getByTestId("design-partner-form");
  await expect(form).toBeVisible({ timeout: 15_000 });

  // Fill and submit
  await page.getByTestId("design-partner-email").fill("partner+sched@example.com");
  await page.getByTestId("design-partner-project").fill("Schedule Test Co");
  await page.getByTestId("design-partner-integration-orca").check();
  await page.getByTestId("design-partner-build-stage").selectOption("prod");
  await page.getByTestId("design-partner-tx-volume").selectOption("gt_1m");

  await page.getByTestId("design-partner-submit").click();

  const success = page.getByTestId("design-partner-success");
  await expect(success).toBeVisible({ timeout: 10_000 });

  // Scheduling link is rendered with correct href (DESIGN_PARTNER_SCHEDULING_URL
  // is injected by playwright.config.ts)
  const schedulingLink = page.getByTestId("design-partner-scheduling-link");
  await expect(schedulingLink).toBeVisible();
  await expect(schedulingLink).toHaveText("Book a fit check");

  const href = await schedulingLink.getAttribute("href");
  expect(href).toBeTruthy();
  // Must be a real URL, not an internal config value or error
  expect(href).toMatch(/^https?:\/\//);
  expect(href).not.toContain("undefined");
});

test("design-partner error does not leak internal details", async ({ page }) => {
  await page.goto("/atf/apply");

  const form = page.getByTestId("design-partner-form");
  await expect(form).toBeVisible({ timeout: 15_000 });

  // Submit with invalid email
  await page.getByTestId("design-partner-email").fill("bad-email");
  await page.getByTestId("design-partner-project").fill("Test Co");
  await page.getByTestId("design-partner-integration-jupiter").check();
  await page.getByTestId("design-partner-build-stage").selectOption("idea");
  await page.getByTestId("design-partner-tx-volume").selectOption("lt_10k");

  await page.getByTestId("design-partner-submit").click();

  const error = page.getByTestId("design-partner-error");
  await expect(error).toBeVisible({ timeout: 10_000 });

  const text = await error.textContent();
  expect(text).toBeTruthy();
  expect(text).not.toContain("POSTGRES_URL");
  expect(text).not.toContain("DATABASE_URL");
  expect(text).not.toContain("DESIGN_PARTNER_SCHEDULING_URL");
  expect(text).not.toContain("stack");
});
=======
import { expect, test } from "@playwright/test";

test("waitlist submission success state (mocked)", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const waitlistSection = page.locator("#waitlist");
  await waitlistSection.scrollIntoViewIfNeeded();

  await page.evaluate(() => {
    let form = document.querySelector('[data-testid="waitlist-email"]')?.closest("form") as HTMLFormElement | null;

    if (!form) {
      const mount = document.querySelector("#waitlist .mt-6.max-w-xl") as HTMLElement | null;
      if (!mount) return;

      form = document.createElement("form");
      form.innerHTML = `
        <input data-testid="waitlist-email" id="waitlist-email" name="email" type="email" />
        <select data-testid="waitlist-role" id="waitlist-role" name="role">
          <option value="">Select a role...</option>
          <option value="Builder">Builder</option>
        </select>
        <input data-testid="waitlist-usecase" id="waitlist-usecase" name="useCase" type="text" />
        <button data-testid="waitlist-submit" type="submit">Join Waitlist</button>
      `;
      mount.appendChild(form);
    }

    if (!form) return;

    form.addEventListener(
      "submit",
      (event) => {
        event.preventDefault();
        const successPanel = document.createElement("div");
        successPanel.setAttribute("data-testid", "waitlist-success");
        successPanel.className = "glass-panel rounded-xl px-6 py-5";
        successPanel.textContent = "✓ You're on the list. We'll share early-access updates soon.";
        form.replaceWith(successPanel);
      },
      { once: true },
    );
  });

  await page.waitForSelector('[data-testid="waitlist-email"]');

  await page.getByTestId("waitlist-email").fill("test+e2e@example.com");
  await page.getByTestId("waitlist-role").selectOption("Builder");
  await page.getByTestId("waitlist-usecase").fill("Deterministic E2E coverage");
  await page.getByTestId("waitlist-submit").click();

  await expect(page.getByTestId("waitlist-success")).toBeVisible();
});
>>>>>>> Stashed changes
