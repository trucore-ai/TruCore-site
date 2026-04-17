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
    // Cap parallel workers at 2 so peak memory stays bounded (~12 GB max).
    maxWorkers: 2,
    // Allow slow jsdom environments up to 60 s per test before timeout.
    testTimeout: 60000,
    // Give workers 30 s to flush teardown (file handles, async cleanup).
    teardownTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.ts", "components/**/*.tsx", "app/actions/**/*.ts"],
    },
  },
});
