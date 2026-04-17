import { configDefaults, defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
    // Use the forks pool so each test file runs in its own child process.
    // OS reclaims all memory when a fork exits, preventing heap accumulation
    // across files. This is critical for the three jsdom-heavy policy test
    // files (customer-policy-overrides, recommendations, advanced) which each
    // mount CustomerPoliciesPage many times.
    pool: "forks",
    // Pass additional arguments to the Node.js process for each fork worker.
    // 6 GB is required: jsdom + React Testing Library + CustomerPoliciesPage
    // mock tree consume ~3-4 GB during module import, exceeding the default
    // V8 cap of ~2 GB. Per Vitest 4 UserConfig type, top-level execArgv maps
    // to child_process.fork({ execArgv: [...] }) for every worker.
    execArgv: ["--max-old-space-size=6144"],
    // One fork at a time prevents concurrent memory pressure when the three
    // jsdom-heavy policy files run alongside the rest of the 100+ file suite.
    // With maxWorkers:2, those files race with other workers and the combined
    // heap causes teardown timeouts. Sequential forks are slower but reliable.
    maxWorkers: 1,
    // Allow slow jsdom environments up to 60 s per test before timeout.
    testTimeout: 60000,
    // Give workers 60 s to flush teardown — matches testTimeout so a slow
    // jsdom cleanup (large React mock tree) never races against the timer.
    teardownTimeout: 60000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.ts", "components/**/*.tsx", "app/actions/**/*.ts"],
    },
  },
});
