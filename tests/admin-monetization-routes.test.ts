import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/* ═══════════ Mocks ═══════════ */

const mocks = vi.hoisted(() => {
  return {
    assertAdminSessionMock: vi.fn(),
    fetchMonetizationSettingsMock: vi.fn(),
    updateMonetizationSettingsMock: vi.fn(),
    resetMonetizationSettingsMock: vi.fn(),
    logSecurityEventMock: vi.fn(),
  };
});

vi.mock("@/lib/admin-auth", () => ({
  assertAdminSession: mocks.assertAdminSessionMock,
}));

vi.mock("@/lib/security-log", () => ({
  logSecurityEvent: mocks.logSecurityEventMock,
}));

vi.mock("@/lib/dashboard-client", () => ({
  fetchMonetizationSettings: mocks.fetchMonetizationSettingsMock,
  updateMonetizationSettings: mocks.updateMonetizationSettingsMock,
  resetMonetizationSettings: mocks.resetMonetizationSettingsMock,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(() => undefined),
  })),
}));

import {
  GET as monetizationGET,
  POST as monetizationPOST,
} from "@/app/api/admin/monetization/route";
import { POST as resetPOST } from "@/app/api/admin/monetization/reset/route";

/* ═══════════ Helpers ═══════════ */

function makeRequest(
  method: string,
  path: string,
  opts?: { body?: string; origin?: string },
): NextRequest {
  const url = `http://localhost:3000${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts?.origin) {
    headers.origin = opts.origin;
  }
  return new NextRequest(url, {
    method,
    headers,
    ...(opts?.body ? { body: opts.body } : {}),
  });
}

/* ═══════════ Setup / Teardown ═══════════ */

const SAMPLE_SETTINGS = {
  monetization_enabled: false,
  pricing_page_enabled: true,
  upgrade_cta_enabled: true,
  quota_enforcement_mode: "off" as const,
  paid_feature_gates_enabled: false,
  real_execution_paid_gate_enabled: false,
  pro_self_serve_enabled: false,
  enterprise_contact_only: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Auth passes by default
  mocks.assertAdminSessionMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ═══════════ GET /api/admin/monetization ═══════════ */

describe("GET /api/admin/monetization", () => {
  it("returns settings on success", async () => {
    mocks.fetchMonetizationSettingsMock.mockResolvedValue({
      ok: true,
      data: SAMPLE_SETTINGS,
    });

    const req = makeRequest("GET", "/api/admin/monetization");
    const res = await monetizationGET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.settings).toEqual(SAMPLE_SETTINGS);
  });

  it("returns 502 when backend is unavailable", async () => {
    mocks.fetchMonetizationSettingsMock.mockResolvedValue({
      ok: false,
      error: "timeout",
    });

    const req = makeRequest("GET", "/api/admin/monetization");
    const res = await monetizationGET(req);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error).toBe("monetization_settings_unavailable");
  });

  it("returns 404 for unauthenticated requests", async () => {
    mocks.assertAdminSessionMock.mockRejectedValue(new Error("no session"));

    const req = makeRequest("GET", "/api/admin/monetization");
    const res = await monetizationGET(req);

    expect(res.status).toBe(404);
    expect(mocks.fetchMonetizationSettingsMock).not.toHaveBeenCalled();
  });
});

/* ═══════════ POST /api/admin/monetization ═══════════ */

describe("POST /api/admin/monetization", () => {
  it("updates settings on success", async () => {
    const updated = { ...SAMPLE_SETTINGS, monetization_enabled: true };
    mocks.updateMonetizationSettingsMock.mockResolvedValue({
      ok: true,
      data: updated,
    });

    const req = makeRequest("POST", "/api/admin/monetization", {
      body: JSON.stringify({ monetization_enabled: true }),
      origin: "http://localhost:3000",
    });
    const res = await monetizationPOST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.settings).toEqual(updated);
    expect(mocks.updateMonetizationSettingsMock).toHaveBeenCalledWith({
      monetization_enabled: true,
    });
  });

  it("returns 400 when update fails", async () => {
    mocks.updateMonetizationSettingsMock.mockResolvedValue({
      ok: false,
      error: "invalid field",
    });

    const req = makeRequest("POST", "/api/admin/monetization", {
      body: JSON.stringify({ bad_field: true }),
      origin: "http://localhost:3000",
    });
    const res = await monetizationPOST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("update_failed");
  });

  it("returns 404 when CSRF origin is missing", async () => {
    const req = makeRequest("POST", "/api/admin/monetization", {
      body: JSON.stringify({ monetization_enabled: true }),
    });
    const res = await monetizationPOST(req);

    expect(res.status).toBe(404);
    expect(mocks.updateMonetizationSettingsMock).not.toHaveBeenCalled();
  });
});

/* ═══════════ POST /api/admin/monetization/reset ═══════════ */

describe("POST /api/admin/monetization/reset", () => {
  it("resets to defaults on success", async () => {
    mocks.resetMonetizationSettingsMock.mockResolvedValue({
      ok: true,
      data: SAMPLE_SETTINGS,
    });

    const req = makeRequest("POST", "/api/admin/monetization/reset", {
      origin: "http://localhost:3000",
    });
    const res = await resetPOST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.settings).toEqual(SAMPLE_SETTINGS);
    expect(body.reset).toBe(true);
  });

  it("returns 400 when reset fails", async () => {
    mocks.resetMonetizationSettingsMock.mockResolvedValue({
      ok: false,
      error: "backend error",
    });

    const req = makeRequest("POST", "/api/admin/monetization/reset", {
      origin: "http://localhost:3000",
    });
    const res = await resetPOST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("reset_failed");
  });

  it("returns 404 for unauthenticated requests", async () => {
    mocks.assertAdminSessionMock.mockRejectedValue(new Error("no session"));

    const req = makeRequest("POST", "/api/admin/monetization/reset", {
      origin: "http://localhost:3000",
    });
    const res = await resetPOST(req);

    expect(res.status).toBe(404);
    expect(mocks.resetMonetizationSettingsMock).not.toHaveBeenCalled();
  });
});
