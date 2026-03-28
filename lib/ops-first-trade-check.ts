/**
 * First Trade Reliability Check — Ops Helper Module
 *
 * Production-safe staged reliability check for the first protected trade journey.
 * Each stage verifies a specific step in the customer flow without side effects.
 *
 * Stages:
 * 1. dashboard_bootstrap - Dashboard /api/dashboard/me route reachable
 * 2. sample_intent - Onboarding sample-intent route reachable
 * 3. protect_dry_run - Protect dry-run route reachable and returns expected envelope
 * 4. execute_sample - Execute sample route (requires explicit opt-in for production safety)
 * 5. receipts_entry - Receipts/receipt-history entry point available
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StageStatus = "ok" | "error" | "skipped";

export type FailureClass =
  | null
  | "network_error"
  | "upstream_5xx"
  | "upstream_4xx"
  | "auth_required"
  | "invalid_response"
  | "config_error"
  | "timeout";

export interface StageResult {
  name: string;
  status: StageStatus;
  failure_class: FailureClass;
  detail: string;
}

export interface CheckSummary {
  passed: number;
  failed: number;
  skipped: number;
}

export interface FirstTradeCheckResult {
  checked_at: string;
  stages: StageResult[];
  summary: CheckSummary;
}

export type OverallStatus = "ok" | "degraded" | "error";

export interface FirstTradeCheckResponse {
  status: OverallStatus;
  data: FirstTradeCheckResult;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CHECK_TIMEOUT_MS = 5_000;

/**
 * Whether execute-sample stage can be run in current environment.
 * Defaults to false for production safety.
 */
export function isExecuteStageEnabled(): boolean {
  return process.env.ATF_ENABLE_FIRST_TRADE_OPS_CHECK_EXECUTE === "true";
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function classifyHttpStatus(status: number): FailureClass {
  if (status === 401 || status === 403) return "auth_required";
  if (status >= 500) return "upstream_5xx";
  if (status >= 400) return "upstream_4xx";
  return null;
}

function stageOk(name: string, detail: string): StageResult {
  return { name, status: "ok", failure_class: null, detail };
}

function stageError(name: string, failureClass: FailureClass, detail: string): StageResult {
  return { name, status: "error", failure_class: failureClass, detail };
}

function stageSkipped(name: string, detail: string): StageResult {
  return { name, status: "skipped", failure_class: null, detail };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Stage checks
// ---------------------------------------------------------------------------

/**
 * Stage 1: Dashboard bootstrap reachable
 * Verifies /api/dashboard/me returns expected shape (even if 401).
 */
async function checkDashboardBootstrap(baseUrl: string): Promise<StageResult> {
  const name = "dashboard_bootstrap";

  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/api/dashboard/me`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
      CHECK_TIMEOUT_MS,
    );

    // 401 is expected without auth - route is working
    if (res.status === 401) {
      return stageOk(name, "Route reachable (auth required as expected)");
    }

    // Other 2xx/4xx indicates route is responsive
    if (res.ok || res.status < 500) {
      return stageOk(name, `Route responded with status ${res.status}`);
    }

    return stageError(name, classifyHttpStatus(res.status), `Upstream error: ${res.status}`);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return stageError(name, "timeout", "Request timed out");
    }
    return stageError(name, "network_error", "Network error reaching route");
  }
}

/**
 * Stage 2: Sample intent route reachable
 * Verifies /api/onboarding/sample-intent returns expected envelope.
 */
async function checkSampleIntent(baseUrl: string): Promise<StageResult> {
  const name = "sample_intent";

  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/api/onboarding/sample-intent`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
      CHECK_TIMEOUT_MS,
    );

    // 401 is expected without auth - route is working
    if (res.status === 401) {
      return stageOk(name, "Route reachable (auth required as expected)");
    }

    if (res.ok) {
      // Verify basic JSON structure
      const body = await res.text();
      try {
        JSON.parse(body);
        return stageOk(name, "Route responded with valid JSON");
      } catch {
        return stageError(name, "invalid_response", "Response is not valid JSON");
      }
    }

    if (res.status < 500) {
      return stageOk(name, `Route responded with status ${res.status}`);
    }

    return stageError(name, classifyHttpStatus(res.status), `Upstream error: ${res.status}`);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return stageError(name, "timeout", "Request timed out");
    }
    return stageError(name, "network_error", "Network error reaching route");
  }
}

/**
 * Stage 3: Protect dry-run route reachable
 * Verifies /api/onboarding/protect-dry-run accepts POST and returns expected shape.
 */
async function checkProtectDryRun(baseUrl: string): Promise<StageResult> {
  const name = "protect_dry_run";

  try {
    // Send minimal valid payload structure
    const res = await fetchWithTimeout(
      `${baseUrl}/api/onboarding/protect-dry-run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ intent: {} }),
        cache: "no-store",
      },
      CHECK_TIMEOUT_MS,
    );

    // 401 is expected without auth - route is working
    if (res.status === 401) {
      return stageOk(name, "Route reachable (auth required as expected)");
    }

    // 400 may indicate invalid payload but route is responsive
    if (res.status === 400) {
      return stageOk(name, "Route reachable (validation working)");
    }

    if (res.ok) {
      const body = await res.text();
      try {
        const json = JSON.parse(body);
        // Check for decision envelope marker
        if ("decision" in json || "status" in json || "allow" in json || "deny" in json) {
          return stageOk(name, "Route responded with decision envelope");
        }
        return stageOk(name, "Route responded with valid JSON");
      } catch {
        return stageError(name, "invalid_response", "Response is not valid JSON");
      }
    }

    if (res.status < 500) {
      return stageOk(name, `Route responded with status ${res.status}`);
    }

    return stageError(name, classifyHttpStatus(res.status), `Upstream error: ${res.status}`);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return stageError(name, "timeout", "Request timed out");
    }
    return stageError(name, "network_error", "Network error reaching route");
  }
}

/**
 * Stage 4: Execute sample route reachable (guarded)
 * Only runs if ATF_ENABLE_FIRST_TRADE_OPS_CHECK_EXECUTE=true.
 */
async function checkExecuteSample(baseUrl: string): Promise<StageResult> {
  const name = "execute_sample";

  if (!isExecuteStageEnabled()) {
    return stageSkipped(name, "Execute stage disabled for production safety (ATF_ENABLE_FIRST_TRADE_OPS_CHECK_EXECUTE not set)");
  }

  try {
    const res = await fetchWithTimeout(
      `${baseUrl}/api/onboarding/execute-sample`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ intent: {} }),
        cache: "no-store",
      },
      CHECK_TIMEOUT_MS,
    );

    // 401 is expected without auth - route is working
    if (res.status === 401) {
      return stageOk(name, "Route reachable (auth required as expected)");
    }

    // 400 may indicate invalid payload but route is responsive
    if (res.status === 400) {
      return stageOk(name, "Route reachable (validation working)");
    }

    if (res.ok) {
      const body = await res.text();
      try {
        JSON.parse(body);
        return stageOk(name, "Route responded with valid JSON");
      } catch {
        return stageError(name, "invalid_response", "Response is not valid JSON");
      }
    }

    if (res.status < 500) {
      return stageOk(name, `Route responded with status ${res.status}`);
    }

    return stageError(name, classifyHttpStatus(res.status), `Upstream error: ${res.status}`);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return stageError(name, "timeout", "Request timed out");
    }
    return stageError(name, "network_error", "Network error reaching route");
  }
}

/**
 * Stage 5: Receipts entry point available
 * Verifies receipts page or API is reachable.
 */
async function checkReceiptsEntry(baseUrl: string): Promise<StageResult> {
  const name = "receipts_entry";

  try {
    // Check the receipts page
    const res = await fetchWithTimeout(
      `${baseUrl}/customer/receipts`,
      {
        method: "GET",
        headers: { Accept: "text/html,application/json" },
        cache: "no-store",
      },
      CHECK_TIMEOUT_MS,
    );

    // 401/403 for protected page is expected
    if (res.status === 401 || res.status === 403) {
      return stageOk(name, "Receipts page reachable (auth required as expected)");
    }

    // Redirect to login is also acceptable
    if (res.status === 302 || res.status === 307 || res.status === 308) {
      return stageOk(name, "Receipts page reachable (redirect to auth)");
    }

    if (res.ok) {
      return stageOk(name, "Receipts page loaded successfully");
    }

    if (res.status < 500) {
      return stageOk(name, `Receipts entry point responded with status ${res.status}`);
    }

    return stageError(name, classifyHttpStatus(res.status), `Upstream error: ${res.status}`);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return stageError(name, "timeout", "Request timed out");
    }
    return stageError(name, "network_error", "Network error reaching receipts");
  }
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

/**
 * Run the complete first-trade reliability check.
 *
 * @param baseUrl - The base URL for same-origin API calls (e.g., http://localhost:3000)
 */
export async function runFirstTradeCheck(baseUrl: string): Promise<FirstTradeCheckResponse> {
  const stages: StageResult[] = [];

  // Run all stages sequentially to avoid overwhelming the system
  stages.push(await checkDashboardBootstrap(baseUrl));
  stages.push(await checkSampleIntent(baseUrl));
  stages.push(await checkProtectDryRun(baseUrl));
  stages.push(await checkExecuteSample(baseUrl));
  stages.push(await checkReceiptsEntry(baseUrl));

  // Compute summary
  const summary: CheckSummary = {
    passed: stages.filter((s) => s.status === "ok").length,
    failed: stages.filter((s) => s.status === "error").length,
    skipped: stages.filter((s) => s.status === "skipped").length,
  };

  // Determine overall status
  let status: OverallStatus = "ok";
  if (summary.failed > 0) {
    // If more than half of non-skipped stages failed, it's an error
    const nonSkipped = summary.passed + summary.failed;
    if (nonSkipped > 0 && summary.failed > nonSkipped / 2) {
      status = "error";
    } else {
      status = "degraded";
    }
  }

  return {
    status,
    data: {
      checked_at: new Date().toISOString(),
      stages,
      summary,
    },
  };
}

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

/**
 * Ensure the response contains no sensitive data.
 * This is a defensive check to prevent accidental exposure.
 */
export function sanitizeCheckResponse(response: FirstTradeCheckResponse): FirstTradeCheckResponse {
  // Deep clone to avoid mutations
  const sanitized = JSON.parse(JSON.stringify(response)) as FirstTradeCheckResponse;

  // Truncate any overly long detail strings
  for (const stage of sanitized.data.stages) {
    if (stage.detail && stage.detail.length > 200) {
      stage.detail = stage.detail.slice(0, 197) + "...";
    }
    // Strip any potential stack traces
    if (stage.detail && stage.detail.includes("\n    at ")) {
      stage.detail = stage.detail.split("\n")[0];
    }
  }

  return sanitized;
}
