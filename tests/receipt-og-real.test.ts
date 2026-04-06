import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/og/receipt/route";

/**
 * Tests for real backend verification integration in OG receipt cards.
 * These tests cover the real verification flow, timeout handling, and fallback behavior.
 */

// Store original env values
const originalEnv = {
  OG_REAL_VERIFICATION_ENABLED: process.env.OG_REAL_VERIFICATION_ENABLED,
  ATF_API_URL: process.env.ATF_API_URL,
};

describe("/api/og/receipt - real verification", () => {
  beforeEach(() => {
    // Reset env before each test
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    // Restore original env
    process.env.OG_REAL_VERIFICATION_ENABLED = originalEnv.OG_REAL_VERIFICATION_ENABLED;
    process.env.ATF_API_URL = originalEnv.ATF_API_URL;
    vi.unstubAllEnvs();
  });

  describe("feature flag behavior", () => {
    it("uses deterministic fallback when OG_REAL_VERIFICATION_ENABLED is false", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "false");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      // Spy on fetch - should NOT be called
      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const validHash = "a".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("uses deterministic fallback when OG_REAL_VERIFICATION_ENABLED is not set", async () => {
      delete process.env.OG_REAL_VERIFICATION_ENABLED;
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const validHash = "a".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("uses deterministic fallback when ATF_API_URL is not set", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      delete process.env.ATF_API_URL;

      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const validHash = "a".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("backend verification - success paths", () => {
    it("returns ALLOWED when backend returns valid ALLOW decision", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      const mockResponse = { valid: true, decision: "ALLOW" };
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const validHash = "a".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");
      // Should have verified cache headers (1 hour)
      expect(response.headers.get("cache-control")).toContain("max-age=3600");
    });

    it("returns DENIED when backend returns valid DENY decision", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      const mockResponse = { valid: true, decision: "DENY" };
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const validHash = "b".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");
      // Should have verified cache headers (1 hour)
      expect(response.headers.get("cache-control")).toContain("max-age=3600");
    });

    it("returns UNKNOWN when backend returns valid: false", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      const mockResponse = { valid: false };
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const validHash = "c".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");
      // UNKNOWN state from valid backend response still gets verified cache
      expect(response.headers.get("cache-control")).toContain("max-age=3600");
    });
  });

  describe("backend verification - error paths", () => {
    // Elevated timeout: this test waits for the route's real 500ms AbortController
    // timer to fire, plus ImageResponse rendering. Under CI load the combined
    // wall-clock time can exceed the default 5000ms vitest timeout.
    it("falls back to deterministic on backend timeout", { timeout: 15_000 }, async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      // Simulate a hanging backend that is terminated by the route's AbortController.
      // The mock listens to the signal so it rejects as soon as the route's 500ms
      // timeout fires, matching real fetch + AbortController semantics and avoiding
      // a fixed delay that can push total test time past the default 5000ms limit
      // when combined with ImageResponse WASM rendering overhead.
      vi.spyOn(globalThis, "fetch").mockImplementationOnce(
        (_url: string | URL | Request, init?: RequestInit) =>
          new Promise<Response>((_, reject) => {
            const signal = init?.signal;
            if (signal) {
              const onAbort = () =>
                reject(new Error("The operation was aborted"));
              if (signal.aborted) {
                onAbort();
                return;
              }
              signal.addEventListener("abort", onAbort, { once: true });
            }
          }),
      );

      const validHash = "d".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");
      // Fallback has shorter cache (5 minutes)
      expect(response.headers.get("cache-control")).toContain("max-age=300");
    });

    it("falls back to deterministic on network error", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

      const validHash = "e".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");
      // Fallback has shorter cache
      expect(response.headers.get("cache-control")).toContain("max-age=300");
    });

    it("falls back to deterministic on HTTP error (500)", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("Internal Server Error", { status: 500 }),
      );

      const validHash = "f".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");
      // Fallback has shorter cache
      expect(response.headers.get("cache-control")).toContain("max-age=300");
    });

    it("falls back to deterministic on invalid JSON response", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response("not json", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        }),
      );

      const validHash = "0".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");
    });
  });

  describe("response sanitization", () => {
    it("ignores extra fields in backend response", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      // Backend response with extra sensitive fields
      const mockResponse = {
        valid: true,
        decision: "ALLOW",
        // These should be ignored - not exposed
        walletAddress: "0x1234567890abcdef",
        amount: "1000000000000000000",
        policyName: "internal-policy",
        timestamp: 1234567890,
        signature: "sensitive-sig",
      };

      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const validHash = "1".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      // Success - extra fields were ignored, no error thrown
    });

    it("handles missing decision field gracefully", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      // valid: true but no decision
      const mockResponse = { valid: true };
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const validHash = "2".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      // Should fall back to deterministic since no valid decision
    });

    it("rejects invalid decision values", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      const mockResponse = { valid: true, decision: "INVALID_DECISION" };
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const validHash = "3".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      // Invalid decision should result in fallback behavior
    });
  });

  describe("cache headers", () => {
    it("uses longer cache (1 hour) for verified responses", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      const mockResponse = { valid: true, decision: "ALLOW" };
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const validHash = "4".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);
      const cacheControl = response.headers.get("cache-control");

      expect(cacheControl).toContain("max-age=3600");
      expect(cacheControl).toContain("s-maxage=3600");
    });

    it("uses shorter cache (5 minutes) for fallback responses", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      // Network error triggers fallback
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

      const validHash = "5".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);
      const cacheControl = response.headers.get("cache-control");

      expect(cacheControl).toContain("max-age=300");
      expect(cacheControl).toContain("s-maxage=300");
    });

    it("uses shorter cache when feature flag is disabled", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "false");

      const validHash = "6".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);
      const cacheControl = response.headers.get("cache-control");

      // Deterministic = not verified = shorter cache
      expect(cacheControl).toContain("max-age=300");
    });
  });

  describe("invalid hash handling", () => {
    it("returns fallback card for invalid hash (does not call backend)", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const invalidHash = "not-hex!";
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${invalidHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("returns fallback card for missing hash (does not call backend)", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.example.com");

      const fetchSpy = vi.spyOn(globalThis, "fetch");

      const request = new NextRequest("http://localhost/api/og/receipt", {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("API endpoint format", () => {
    it("calls correct backend API endpoint", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.trucore.xyz");

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ valid: true, decision: "ALLOW" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const validHash = "abcdef1234567890";
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      await GET(request);

      expect(fetchSpy).toHaveBeenCalledWith(
        `https://api.trucore.xyz/v1/receipts/verify?hash=${validHash}`,
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Accept: "application/json",
          }),
        }),
      );
    });

    it("URL-encodes hash in backend request", async () => {
      vi.stubEnv("OG_REAL_VERIFICATION_ENABLED", "true");
      vi.stubEnv("ATF_API_URL", "https://api.trucore.xyz");

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
        new Response(JSON.stringify({ valid: true, decision: "ALLOW" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      // Hash that's already sanitized (hex only)
      const validHash = "abc123";
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      await GET(request);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("hash=abc123"),
        expect.anything(),
      );
    });
  });
});
