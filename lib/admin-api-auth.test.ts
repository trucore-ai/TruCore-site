import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

/* ── mock next/headers cookies used by assertAdminSession ── */
const mocks = vi.hoisted(() => {
  const cookieValues = new Map<string, string>();

  const cookieStore = {
    get: vi.fn((name: string) => {
      const value = cookieValues.get(name);
      return value === undefined ? undefined : { name, value };
    }),
  };

  return {
    cookieValues,
    cookieStore,
    cookiesMock: vi.fn(async () => cookieStore),
  };
});

vi.mock("next/headers", () => ({
  cookies: mocks.cookiesMock,
}));

import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  _getSessionStore,
} from "./admin-auth";
import {
  withAdminApiAuth,
  ADMIN_RESPONSE_HEADERS,
  applyAdminHeaders,
} from "./admin-api-auth";
import { logSecurityEvent } from "./security-log";

const ORIGINAL_ADMIN_KEY = process.env.ADMIN_DASHBOARD_KEY;

/* ── spy on security logging ── */
vi.spyOn(await import("./security-log"), "logSecurityEvent");

function makeRequest(
  method: string,
  pathname: string,
  options?: {
    cookies?: Record<string, string>;
    origin?: string;
  },
): NextRequest {
  const url = new URL(pathname, "http://localhost:3000");
  const headers = new Headers();
  if (options?.origin) {
    headers.set("origin", options.origin);
  }
  const req = new NextRequest(url, { method, headers });
  if (options?.cookies) {
    for (const [name, value] of Object.entries(options.cookies)) {
      req.cookies.set(name, value);
    }
  }
  return req;
}

describe("admin-api-auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cookieValues.clear();
    _getSessionStore().clear();
    process.env.ADMIN_DASHBOARD_KEY = "test-admin-key";
  });

  describe("withAdminApiAuth — session validation", () => {
    it("denies with 404 when no session cookie is present", async () => {
      const handler = withAdminApiAuth(async () =>
        NextResponse.json({ ok: true }),
      );
      const req = makeRequest("GET", "/api/metrics", {
        origin: "http://localhost:3000",
      });
      const res = await handler(req);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe("not_found");
    });

    it("calls handler when session is valid", async () => {
      const token = createSessionToken();
      mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

      const handler = withAdminApiAuth(async () =>
        NextResponse.json({ ok: true }),
      );
      const req = makeRequest("GET", "/api/metrics", {
        origin: "http://localhost:3000",
      });
      const res = await handler(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
    });

    it("logs admin_api_denied on auth failure", async () => {
      const handler = withAdminApiAuth(async () =>
        NextResponse.json({ ok: true }),
      );
      const req = makeRequest("GET", "/api/metrics", {
        origin: "http://localhost:3000",
      });
      await handler(req);

      expect(logSecurityEvent).toHaveBeenCalledWith(
        "admin_api_denied",
        expect.objectContaining({
          meta: expect.objectContaining({ path: "/api/metrics" }),
        }),
      );
    });
  });

  describe("withAdminApiAuth — CSRF Origin check", () => {
    it("denies POST with missing Origin header", async () => {
      const token = createSessionToken();
      mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

      const handler = withAdminApiAuth(async () =>
        NextResponse.json({ ok: true }),
      );
      const req = makeRequest("POST", "/api/keys/create");
      // No origin header
      const res = await handler(req);

      expect(res.status).toBe(404);
    });

    it("denies POST with cross-origin Origin header", async () => {
      const token = createSessionToken();
      mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

      const handler = withAdminApiAuth(async () =>
        NextResponse.json({ ok: true }),
      );
      const req = makeRequest("POST", "/api/keys/create", {
        origin: "http://evil.com",
      });
      const res = await handler(req);

      expect(res.status).toBe(404);
    });

    it("logs csrf_origin_rejected on cross-origin POST", async () => {
      const token = createSessionToken();
      mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

      const handler = withAdminApiAuth(async () =>
        NextResponse.json({ ok: true }),
      );
      const req = makeRequest("POST", "/api/keys/create", {
        origin: "http://evil.com",
      });
      await handler(req);

      expect(logSecurityEvent).toHaveBeenCalledWith(
        "csrf_origin_rejected",
        expect.objectContaining({
          meta: expect.objectContaining({
            method: "POST",
            path: "/api/keys/create",
          }),
        }),
      );
    });

    it("allows POST with same-origin Origin header", async () => {
      const token = createSessionToken();
      mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

      const handler = withAdminApiAuth(async () =>
        NextResponse.json({ ok: true }),
      );
      const req = makeRequest("POST", "/api/keys/create", {
        origin: "http://localhost:3000",
      });
      const res = await handler(req);

      expect(res.status).toBe(200);
    });

    it("allows GET without Origin header when csrf is default", async () => {
      const token = createSessionToken();
      mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

      const handler = withAdminApiAuth(async () =>
        NextResponse.json({ ok: true }),
      );
      const req = makeRequest("GET", "/api/metrics");
      const res = await handler(req);

      expect(res.status).toBe(200);
    });

    it("skips CSRF check when csrf option is false", async () => {
      const token = createSessionToken();
      mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

      const handler = withAdminApiAuth(
        async () => NextResponse.json({ ok: true }),
        { csrf: false },
      );
      const req = makeRequest("POST", "/api/metrics");
      // No origin header — would normally fail
      const res = await handler(req);

      expect(res.status).toBe(200);
    });
  });

  describe("response header hardening", () => {
    it("applies Cache-Control: no-store to successful responses", async () => {
      const token = createSessionToken();
      mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

      const handler = withAdminApiAuth(async () =>
        NextResponse.json({ ok: true }),
      );
      const req = makeRequest("GET", "/api/metrics");
      const res = await handler(req);

      expect(res.headers.get("cache-control")).toBe("no-store");
    });

    it("applies Cache-Control: no-store to denial responses", async () => {
      const handler = withAdminApiAuth(async () =>
        NextResponse.json({ ok: true }),
      );
      const req = makeRequest("GET", "/api/metrics");
      const res = await handler(req);

      expect(res.headers.get("cache-control")).toBe("no-store");
    });

    it("applies X-Content-Type-Options: nosniff", async () => {
      const token = createSessionToken();
      mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

      const handler = withAdminApiAuth(async () =>
        NextResponse.json({ ok: true }),
      );
      const req = makeRequest("GET", "/api/metrics");
      const res = await handler(req);

      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    });

    it("applies Referrer-Policy: same-origin", async () => {
      const token = createSessionToken();
      mocks.cookieValues.set(ADMIN_COOKIE_NAME, token);

      const handler = withAdminApiAuth(async () =>
        NextResponse.json({ ok: true }),
      );
      const req = makeRequest("GET", "/api/metrics");
      const res = await handler(req);

      expect(res.headers.get("referrer-policy")).toBe("same-origin");
    });

    it("applyAdminHeaders adds all expected headers", () => {
      const res = NextResponse.json({ ok: true });
      applyAdminHeaders(res);

      for (const [key, value] of Object.entries(ADMIN_RESPONSE_HEADERS)) {
        expect(res.headers.get(key)).toBe(value);
      }
    });
  });
});

afterAll(() => {
  if (ORIGINAL_ADMIN_KEY === undefined) {
    delete process.env.ADMIN_DASHBOARD_KEY;
    return;
  }

  process.env.ADMIN_DASHBOARD_KEY = ORIGINAL_ADMIN_KEY;
});
