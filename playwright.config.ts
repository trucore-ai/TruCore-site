<<<<<<< Updated upstream
import { defineConfig } from "@playwright/test";

const adminDashboardKey = process.env.ADMIN_DASHBOARD_KEY || "e2e-admin-key";
const receiptSigningKey = process.env.RECEIPT_SIGNING_KEY || "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
const e2eTestSecret = process.env.ATF_E2E_TEST_SECRET || "e2e-test-secret";
const designPartnerSchedulingUrl = process.env.DESIGN_PARTNER_SCHEDULING_URL || "https://cal.com/trucore/design-partner";

/**
 * reuseExistingServer: honour PW_REUSE_SERVER env (default: false in CI, true locally).
 * Setting to false ensures deterministic env — the webServer command injects all required
 * env vars, so reusing an already-running dev server would produce unpredictable results.
 */
const reuseExistingServer = process.env.CI
  ? false
  : process.env.PW_REUSE_SERVER === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: `ADMIN_DASHBOARD_KEY=${adminDashboardKey} RECEIPT_SIGNING_KEY=${receiptSigningKey} WAITLIST_FALLBACK_MODE=memory DESIGN_PARTNER_SCHEDULING_URL=${designPartnerSchedulingUrl} npm run build && ADMIN_DASHBOARD_KEY=${adminDashboardKey} RECEIPT_SIGNING_KEY=${receiptSigningKey} ATF_E2E_TEST_SECRET=${e2eTestSecret} WAITLIST_FALLBACK_MODE=memory DESIGN_PARTNER_SCHEDULING_URL=${designPartnerSchedulingUrl} npm start`,
    port: 3000,
    reuseExistingServer,
    timeout: 120_000,
  },
});
=======
import { defineConfig } from "@playwright/test";

const adminDashboardKey = process.env.ADMIN_DASHBOARD_KEY || "e2e-admin-key";

export default defineConfig({
  testDir: "./tests/e2e",
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: `ADMIN_DASHBOARD_KEY=${adminDashboardKey} npm run build && ADMIN_DASHBOARD_KEY=${adminDashboardKey} npm start`,
    port: 3000,
    reuseExistingServer: true,
  },
});
>>>>>>> Stashed changes
