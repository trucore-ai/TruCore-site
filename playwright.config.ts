import { defineConfig } from "@playwright/test";

const adminDashboardKey = process.env.ADMIN_DASHBOARD_KEY || "e2e-admin-key";
const receiptSigningKey = process.env.RECEIPT_SIGNING_KEY || "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";
const e2eTestSecret = process.env.ATF_E2E_TEST_SECRET || "e2e-test-secret";

export default defineConfig({
  testDir: "./tests/e2e",
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: `ADMIN_DASHBOARD_KEY=${adminDashboardKey} RECEIPT_SIGNING_KEY=${receiptSigningKey} npm run build && ADMIN_DASHBOARD_KEY=${adminDashboardKey} RECEIPT_SIGNING_KEY=${receiptSigningKey} ATF_E2E_TEST_SECRET=${e2eTestSecret} npm start`,
    port: 3000,
    reuseExistingServer: true,
  },
});
