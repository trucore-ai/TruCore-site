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
