import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/ops/route-failures/route";
import {
  shouldTriggerRouteFailureAlert,
  _resetSecurityEventCounters,
} from "@/lib/security-log";
import { NextRequest } from "next/server";

const ORIGINAL_ENV = { ...process.env };

function fakeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost/api/ops/route-failures", {
    headers,
  });
}

beforeEach(() => {
  _resetSecurityEventCounters();
  process.env = { ...ORIGINAL_ENV, ATF_OPS_KEY: "test-ops-key-123" };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("GET /api/ops/route-failures", () => {
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
  });

  it("returns 503 when ATF_OPS_KEY is not configured", async () => {
    delete process.env.ATF_OPS_KEY;
    const res = await GET(fakeRequest({ "x-ops-key": "anything" }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("endpoint_not_configured");
  });

  /* ── Happy path ── */

  it("returns empty routes when no failures recorded", async () => {
    const res = await GET(
      fakeRequest({ "x-ops-key": "test-ops-key-123" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.data.routes).toEqual([]);
  });

  it("returns aggregated stats after failures", async () => {
    // Record some failures to populate state
    for (let i = 0; i < 3; i++) {
      shouldTriggerRouteFailureAlert("sandbox/protect");
    }

    const res = await GET(
      fakeRequest({ "x-ops-key": "test-ops-key-123" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");

    const route = body.data.routes.find(
      (r: { route: string }) => r.route === "sandbox/protect",
    );
    expect(route).toBeDefined();
    expect(route.count).toBe(3);
  });

  it("includes last_alert_ts after alert fires", async () => {
    for (let i = 0; i < 5; i++) {
      shouldTriggerRouteFailureAlert("sandbox/protect");
    }

    const res = await GET(
      fakeRequest({ "x-ops-key": "test-ops-key-123" }),
    );
    const body = await res.json();
    const route = body.data.routes.find(
      (r: { route: string }) => r.route === "sandbox/protect",
    );
    expect(route.last_alert_ts).toBeGreaterThan(0);
  });

  /* ── Sanitization ── */

  it("does not include sensitive fields in response", async () => {
    for (let i = 0; i < 3; i++) {
      shouldTriggerRouteFailureAlert("sandbox/protect");
    }

    const res = await GET(
      fakeRequest({ "x-ops-key": "test-ops-key-123" }),
    );
    const text = await res.text();

    // Must not contain secrets, tokens, or user identifiers
    expect(text).not.toContain("api_key");
    expect(text).not.toContain("token");
    expect(text).not.toContain("cookie");
    expect(text).not.toContain("authorization");
    expect(text).not.toContain("password");
    expect(text).not.toContain("secret");
  });

  /* ── Cache headers ── */

  it("sets no-store cache header", async () => {
    const res = await GET(
      fakeRequest({ "x-ops-key": "test-ops-key-123" }),
    );
    expect(res.headers.get("Cache-Control")).toBe("no-store");
  });
});
