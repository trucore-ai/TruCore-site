import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/ops/first-trade-check/route";
import { NextRequest } from "next/server";

const ORIGINAL_ENV = { ...process.env };

/* ------------------------------------------------------------------ */
/*  Mock fetch globally so no real HTTP calls are made during check    */
/* ------------------------------------------------------------------ */
const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

function fakeRequest(
  headers: Record<string, string> = {},
  searchParams: Record<string, string> = {},
): NextRequest {
  const url = new URL("http://localhost:3000/api/ops/first-trade-check");
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url.toString(), {
    headers: {
      host: "localhost:3000",
      ...headers,
    },
  });
}

function mockFetchResponse(status: number, body?: unknown) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body ?? {})),
    headers: new Map([["content-type", "application/json"]]),
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  process.env = { ...ORIGINAL_ENV, ATF_OPS_KEY: "test-ops-key-123" };

  // Default mock: all routes respond with 401 (auth required = healthy)
  fetchMock.mockImplementation((url: string) => {
    if (typeof url === "string") {
      if (url.includes("/dashboard/me")) return mockFetchResponse(401);
      if (url.includes("/sample-intent")) return mockFetchResponse(401);
      if (url.includes("/protect-dry-run")) return mockFetchResponse(401);
      if (url.includes("/execute-sample")) return mockFetchResponse(401);
      if (url.includes("/receipts")) return mockFetchResponse(401);
    }
    return mockFetchResponse(404);
  });
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("GET /api/ops/first-trade-check", () => {
  /* ── Access control ── */

  it("returns 403 without x-ops-key header", async () => {
    const res = await GET(fakeRequest());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden");
  });

  it("returns 403 with wrong x-ops-key", async () => {
    const res = await GET(fakeRequest({ "x-ops-key": "wrong-key" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("forbidden");
  });

  it("returns 503 when ATF_OPS_KEY is not configured", async () => {
    delete process.env.ATF_OPS_KEY;
    const res = await GET(fakeRequest({ "x-ops-key": "anything" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("endpoint_not_configured");
  });

  /* ── Success cases ── */

  it("returns ok status when all stages pass", async () => {
    const res = await GET(fakeRequest({ "x-ops-key": "test-ops-key-123" }));
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.status).toBe("ok");
    expect(body.data).toBeDefined();
    expect(body.data.checked_at).toBeDefined();
    expect(body.data.stages).toBeInstanceOf(Array);
    expect(body.data.stages.length).toBe(5);
    expect(body.data.summary).toBeDefined();
    expect(body.data.summary.passed).toBeGreaterThan(0);
  });

  it("returns all expected stages", async () => {
    const res = await GET(fakeRequest({ "x-ops-key": "test-ops-key-123" }));
    const body = await res.json();

    const stageNames = body.data.stages.map((s: { name: string }) => s.name);
    expect(stageNames).toContain("dashboard_bootstrap");
    expect(stageNames).toContain("sample_intent");
    expect(stageNames).toContain("protect_dry_run");
    expect(stageNames).toContain("execute_sample");
    expect(stageNames).toContain("receipts_entry");
  });

  it("marks execute_sample as skipped when flag is not set", async () => {
    delete process.env.ATF_ENABLE_FIRST_TRADE_OPS_CHECK_EXECUTE;
    const res = await GET(fakeRequest({ "x-ops-key": "test-ops-key-123" }));
    const body = await res.json();

    const executeStage = body.data.stages.find(
      (s: { name: string }) => s.name === "execute_sample",
    );
    expect(executeStage).toBeDefined();
    expect(executeStage.status).toBe("skipped");
    expect(executeStage.detail).toContain("disabled for production safety");
  });

  it("runs execute_sample when flag is enabled", async () => {
    process.env.ATF_ENABLE_FIRST_TRADE_OPS_CHECK_EXECUTE = "true";
    const res = await GET(fakeRequest({ "x-ops-key": "test-ops-key-123" }));
    const body = await res.json();

    const executeStage = body.data.stages.find(
      (s: { name: string }) => s.name === "execute_sample",
    );
    expect(executeStage).toBeDefined();
    expect(executeStage.status).toBe("ok");
  });

  /* ── Degraded/error states ── */

  it("returns degraded status when one stage fails", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (typeof url === "string") {
        if (url.includes("/dashboard/me")) return mockFetchResponse(500);
        if (url.includes("/sample-intent")) return mockFetchResponse(401);
        if (url.includes("/protect-dry-run")) return mockFetchResponse(401);
        if (url.includes("/execute-sample")) return mockFetchResponse(401);
        if (url.includes("/receipts")) return mockFetchResponse(401);
      }
      return mockFetchResponse(404);
    });

    const res = await GET(fakeRequest({ "x-ops-key": "test-ops-key-123" }));
    const body = await res.json();

    expect(body.status).toBe("degraded");
    expect(body.data.summary.failed).toBe(1);

    const dashboardStage = body.data.stages.find(
      (s: { name: string }) => s.name === "dashboard_bootstrap",
    );
    expect(dashboardStage.status).toBe("error");
    expect(dashboardStage.failure_class).toBe("upstream_5xx");
  });

  it("returns error status when majority of stages fail", async () => {
    fetchMock.mockImplementation(() => mockFetchResponse(500));

    const res = await GET(fakeRequest({ "x-ops-key": "test-ops-key-123" }));
    const body = await res.json();

    expect(body.status).toBe("error");
    expect(res.status).toBe(503);
  });

  /* ── Minimal format ── */

  it("supports minimal format query parameter", async () => {
    const res = await GET(
      fakeRequest({ "x-ops-key": "test-ops-key-123" }, { format: "minimal" }),
    );
    const body = await res.json();

    expect(body.status).toBe("ok");
    expect(body.data.checked_at).toBeDefined();
    expect(body.data.summary).toBeDefined();
    expect(body.data.stages).toBeUndefined();
  });

  /* ── Sanitization ── */

  it("does not include sensitive fields in response", async () => {
    const res = await GET(fakeRequest({ "x-ops-key": "test-ops-key-123" }));
    const text = await res.text();

    // Must not contain secrets, tokens, or user identifiers
    expect(text.toLowerCase()).not.toContain("api_key");
    expect(text.toLowerCase()).not.toContain("token");
    expect(text.toLowerCase()).not.toContain("cookie");
    expect(text.toLowerCase()).not.toContain("authorization");
    expect(text.toLowerCase()).not.toContain("password");
    expect(text.toLowerCase()).not.toContain("secret");
    expect(text).not.toContain("Bearer");
  });

  it("does not include raw stack traces", async () => {
    // Make a stage fail with an error
    fetchMock.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/dashboard/me")) {
        return Promise.reject(new Error("Connection failed\n    at fetch (...)"));
      }
      return mockFetchResponse(401);
    });

    const res = await GET(fakeRequest({ "x-ops-key": "test-ops-key-123" }));
    const text = await res.text();

    expect(text).not.toContain("    at ");
    expect(text).not.toContain("Error:");
  });

  /* ── Cache headers ── */

  it("sets no-store cache header", async () => {
    const res = await GET(fakeRequest({ "x-ops-key": "test-ops-key-123" }));
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });

  /* ── Stage validation ── */

  it("validates protect_dry_run accepts POST", async () => {
    fetchMock.mockImplementation((url: string, options?: RequestInit) => {
      if (typeof url === "string" && url.includes("/protect-dry-run")) {
        expect(options?.method).toBe("POST");
        expect(options?.body).toBeDefined();
        return mockFetchResponse(401);
      }
      return mockFetchResponse(401);
    });

    await GET(fakeRequest({ "x-ops-key": "test-ops-key-123" }));
    expect(fetchMock).toHaveBeenCalled();
  });

  it("treats 400 response as ok (validation working)", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/protect-dry-run")) {
        return mockFetchResponse(400, { error: "invalid_body" });
      }
      return mockFetchResponse(401);
    });

    const res = await GET(fakeRequest({ "x-ops-key": "test-ops-key-123" }));
    const body = await res.json();

    const protectStage = body.data.stages.find(
      (s: { name: string }) => s.name === "protect_dry_run",
    );
    expect(protectStage.status).toBe("ok");
    expect(protectStage.detail).toContain("validation working");
  });

  /* ── Network error handling ── */

  it("handles network errors gracefully", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("/sample-intent")) {
        return Promise.reject(new Error("Network error"));
      }
      return mockFetchResponse(401);
    });

    const res = await GET(fakeRequest({ "x-ops-key": "test-ops-key-123" }));
    const body = await res.json();

    expect(body.status).toBe("degraded");
    const sampleStage = body.data.stages.find(
      (s: { name: string }) => s.name === "sample_intent",
    );
    expect(sampleStage.status).toBe("error");
    expect(sampleStage.failure_class).toBe("network_error");
  });
});

describe("Stage result validation", () => {
  it("each stage has required fields", async () => {
    const res = await GET(fakeRequest({ "x-ops-key": "test-ops-key-123" }));
    const body = await res.json();

    for (const stage of body.data.stages) {
      expect(stage).toHaveProperty("name");
      expect(stage).toHaveProperty("status");
      expect(stage).toHaveProperty("failure_class");
      expect(stage).toHaveProperty("detail");
      expect(["ok", "error", "skipped"]).toContain(stage.status);
    }
  });

  it("summary counts match stage statuses", async () => {
    const res = await GET(fakeRequest({ "x-ops-key": "test-ops-key-123" }));
    const body = await res.json();

    const okCount = body.data.stages.filter(
      (s: { status: string }) => s.status === "ok",
    ).length;
    const errorCount = body.data.stages.filter(
      (s: { status: string }) => s.status === "error",
    ).length;
    const skippedCount = body.data.stages.filter(
      (s: { status: string }) => s.status === "skipped",
    ).length;

    expect(body.data.summary.passed).toBe(okCount);
    expect(body.data.summary.failed).toBe(errorCount);
    expect(body.data.summary.skipped).toBe(skippedCount);
  });
});
