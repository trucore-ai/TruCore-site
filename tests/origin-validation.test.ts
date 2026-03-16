import { describe, it, expect } from "vitest";
import { isOriginValid, getRequestIp } from "@/lib/security/origin";

/* ---------- minimal NextRequest stub ---------- */

function makeRequest(
  method: string,
  url: string,
  headers: Record<string, string> = {},
): { method: string; headers: { get: (k: string) => string | null }; nextUrl: URL } {
  const headerMap = new Map(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return {
    method,
    headers: { get: (k: string) => headerMap.get(k.toLowerCase()) ?? null },
    nextUrl: new URL(url),
  } as unknown as import("next/server").NextRequest;
}

/* ═══════════════ isOriginValid ═══════════════ */

describe("isOriginValid", () => {
  it("returns true for GET requests regardless of Origin", () => {
    const req = makeRequest("GET", "https://example.com/admin/waitlist");
    expect(isOriginValid(req as never)).toBe(true);
  });

  it("returns true for HEAD requests regardless of Origin", () => {
    const req = makeRequest("HEAD", "https://example.com/admin/waitlist");
    expect(isOriginValid(req as never)).toBe(true);
  });

  it("returns true for POST with matching Origin", () => {
    const req = makeRequest("POST", "https://example.com/admin/login", {
      origin: "https://example.com",
    });
    expect(isOriginValid(req as never)).toBe(true);
  });

  it("returns false for POST with missing Origin (fail closed)", () => {
    const req = makeRequest("POST", "https://example.com/admin/login");
    expect(isOriginValid(req as never)).toBe(false);
  });

  it("returns false for POST with mismatched Origin", () => {
    const req = makeRequest("POST", "https://example.com/admin/login", {
      origin: "https://evil.com",
    });
    expect(isOriginValid(req as never)).toBe(false);
  });

  it("returns false for PUT with missing Origin", () => {
    const req = makeRequest("PUT", "https://example.com/api/admin/security");
    expect(isOriginValid(req as never)).toBe(false);
  });

  it("returns false for DELETE with missing Origin", () => {
    const req = makeRequest("DELETE", "https://example.com/api/keys/revoke");
    expect(isOriginValid(req as never)).toBe(false);
  });

  it("returns false for PATCH with mismatched Origin", () => {
    const req = makeRequest("PATCH", "https://example.com/api/data", {
      origin: "https://attacker.example",
    });
    expect(isOriginValid(req as never)).toBe(false);
  });

  it("returns true for POST with same-origin (port-sensitive)", () => {
    const req = makeRequest("POST", "http://localhost:3000/admin/login", {
      origin: "http://localhost:3000",
    });
    expect(isOriginValid(req as never)).toBe(true);
  });

  it("returns false for POST with different port", () => {
    const req = makeRequest("POST", "http://localhost:3000/admin/login", {
      origin: "http://localhost:4000",
    });
    expect(isOriginValid(req as never)).toBe(false);
  });
});

/* ═══════════════ getRequestIp ═══════════════ */

describe("getRequestIp", () => {
  it("extracts IP from x-forwarded-for (first entry)", () => {
    const req = makeRequest("GET", "https://example.com/", {
      "x-forwarded-for": "1.2.3.4, 5.6.7.8",
    });
    expect(getRequestIp(req as never)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const req = makeRequest("GET", "https://example.com/", {
      "x-real-ip": "10.0.0.1",
    });
    expect(getRequestIp(req as never)).toBe("10.0.0.1");
  });

  it("returns 'unknown' with no IP headers", () => {
    const req = makeRequest("GET", "https://example.com/");
    expect(getRequestIp(req as never)).toBe("unknown");
  });

  it("trims whitespace from x-forwarded-for entries", () => {
    const req = makeRequest("GET", "https://example.com/", {
      "x-forwarded-for": "  9.8.7.6  , 5.4.3.2",
    });
    expect(getRequestIp(req as never)).toBe("9.8.7.6");
  });
});
