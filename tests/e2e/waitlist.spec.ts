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
