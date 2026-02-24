import { defineConfig } from "@playwright/test";

const adminDashboardKey = process.env.ADMIN_DASHBOARD_KEY || "e2e-admin-key";
const receiptSigningKey = process.env.RECEIPT_SIGNING_KEY || "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=";

export default defineConfig({
  testDir: "./tests/e2e",
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: {
    command: `ADMIN_DASHBOARD_KEY=${adminDashboardKey} RECEIPT_SIGNING_KEY=${receiptSigningKey} npm run build && ADMIN_DASHBOARD_KEY=${adminDashboardKey} RECEIPT_SIGNING_KEY=${receiptSigningKey} npm start`,
    port: 3000,
    reuseExistingServer: true,
  },
});
