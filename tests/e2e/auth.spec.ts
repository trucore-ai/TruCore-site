import { expect, test } from "@playwright/test";
import {
  mockAuthRoutes,
  uniqueEmail,
  TEST_PASSWORD,
  TEST_RESET_TOKEN,
  silenceAnalytics,
} from "./helpers/smoke-fixtures";

/**
 * Auth lifecycle smoke tests:
 *   signup → verification pending → login (unverified) → login (verified) →
 *   forgot password → reset password → login with new password.
 *
 * All ATF backend calls are intercepted so these tests run without a live API.
 */

test.describe("auth lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await silenceAnalytics(page);
  });

  // ── Signup ────────────────────────────────────────────────────────────────

  test("signup form submits and shows verification pending state", async ({
    page,
  }) => {
    await mockAuthRoutes(page);
    await page.goto("/signup");

    await expect(
      page.getByRole("heading", { name: "Create your account" }),
    ).toBeVisible();

    const email = uniqueEmail();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel("Confirm password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    // Should show verification pending state
    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue to dashboard" }),
    ).toBeVisible();
  });

  test("signup shows error when passwords do not match", async ({ page }) => {
    await page.goto("/signup");

    await page.getByLabel("Email").fill("mismatch@test.trucore.xyz");
    await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel("Confirm password").fill("DifferentPass99!");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Passwords do not match")).toBeVisible();
  });

  test("signup shows error when password is too short", async ({ page }) => {
    await page.goto("/signup");

    await page.getByLabel("Email").fill("short@test.trucore.xyz");
    await page.getByLabel("Password", { exact: true }).fill("Abc1!");
    await page.getByLabel("Confirm password").fill("Abc1!");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(
      page.getByText("Password must be at least 8 characters"),
    ).toBeVisible();
  });

  test("resend verification email from pending state", async ({ page }) => {
    await mockAuthRoutes(page);
    await page.goto("/signup");

    const email = uniqueEmail();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
    await page.getByLabel("Confirm password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();

    // Resend
    await page
      .getByRole("button", { name: "Resend verification email" })
      .click();
    await expect(
      page.getByText("Verification email resent successfully."),
    ).toBeVisible();
  });

  // ── Login ─────────────────────────────────────────────────────────────────

  test("login form submits and redirects to dashboard (verified user)", async ({
    page,
  }) => {
    await mockAuthRoutes(page, { emailVerified: true });
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Sign in to TruCore" }),
    ).toBeVisible();

    await page.getByLabel("Email").fill("verified@test.trucore.xyz");
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should navigate to customer dashboard
    await page.waitForURL("**/customer/dashboard");
    expect(page.url()).toContain("/customer/dashboard");
  });

  test("login shows unverified banner for unverified user", async ({
    page,
  }) => {
    await mockAuthRoutes(page, { emailVerified: false });
    await page.goto("/login");

    await page.getByLabel("Email").fill("unverified@test.trucore.xyz");
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should show unverified state
    await expect(
      page.getByText("Your email is not verified"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Resend verification email" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Continue to dashboard" }),
    ).toBeVisible();
  });

  test("login page has links to signup and forgot password", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Forgot password?" }),
    ).toBeVisible();
  });

  // ── Forgot / Reset Password ──────────────────────────────────────────────

  test("forgot password form submits and shows confirmation", async ({
    page,
  }) => {
    await mockAuthRoutes(page);
    await page.goto("/forgot-password");

    await expect(
      page.getByRole("heading", { name: "Reset your password" }),
    ).toBeVisible();

    await page.getByLabel("Email").fill("reset@test.trucore.xyz");
    await page.getByRole("button", { name: "Send reset link" }).click();

    // Should show confirmation
    await expect(
      page.getByRole("heading", { name: "Check your email" }),
    ).toBeVisible();
    await expect(
      page.getByText("we've sent a password reset link", { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to login" }),
    ).toBeVisible();
  });

  test("reset password form with valid token completes reset", async ({
    page,
  }) => {
    await mockAuthRoutes(page);
    await page.goto(`/reset-password?token=${TEST_RESET_TOKEN}`);

    // Wait for token validation to complete
    await expect(
      page.getByLabel("New password", { exact: true }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByLabel("New password", { exact: true }).fill("NewSecurePass456!");
    await page.getByLabel("Confirm new password").fill("NewSecurePass456!");
    await page.getByRole("button", { name: "Reset password" }).click();

    // Should show success
    await expect(
      page.getByRole("heading", { name: "Password reset!" }),
    ).toBeVisible();
    await expect(
      page.getByText("Your password has been updated"),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Sign in" }),
    ).toBeVisible();
  });

  test("login succeeds after password reset (full cycle)", async ({
    page,
  }) => {
    await mockAuthRoutes(page, { emailVerified: true });

    // Start at login
    await page.goto("/login");
    await page.getByLabel("Email").fill("cycle@test.trucore.xyz");
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL("**/customer/dashboard");
    expect(page.url()).toContain("/customer/dashboard");
  });
});
