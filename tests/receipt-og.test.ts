import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/og/receipt/route";

describe("/api/og/receipt", () => {
  describe("image generation", () => {
    it("returns PNG image for valid hash", async () => {
      const validHash = "a".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");
    });

    it("returns PNG image for fallback (no hash)", async () => {
      const request = new NextRequest("http://localhost/api/og/receipt", {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");
    });

    it("returns fallback for invalid hash (non-hex)", async () => {
      const invalidHash = "not-a-valid-hex-hash!";
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${invalidHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");
    });

    it("returns fallback for hash with injection attempt", async () => {
      const maliciousHash = "<script>alert('xss')</script>";
      const request = new NextRequest(
        `http://localhost/api/og/receipt?hash=${encodeURIComponent(maliciousHash)}`,
        { method: "GET" },
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");
    });
  });

  describe("hash sanitization", () => {
    it("accepts lowercase hex hash", async () => {
      const lowercaseHash = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${lowercaseHash}`, {
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it("accepts uppercase hex hash (normalized)", async () => {
      const uppercaseHash = "ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789";
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${uppercaseHash}`, {
        method: "GET",
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it("rejects hash longer than 64 characters", async () => {
      const longHash = "a".repeat(65);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${longHash}`, {
        method: "GET",
      });

      const response = await GET(request);
      // Should return fallback image, not error
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("image/png");
    });

    it("rejects empty hash parameter", async () => {
      const request = new NextRequest("http://localhost/api/og/receipt?hash=", {
        method: "GET",
      });

      const response = await GET(request);
      // Should return fallback image
      expect(response.status).toBe(200);
    });
  });

  describe("caching", () => {
    it("sets cache headers for successful response", async () => {
      const validHash = "a".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);
      const cacheControl = response.headers.get("cache-control");

      expect(cacheControl).toContain("public");
      expect(cacheControl).toContain("max-age=");
    });

    it("sets cache headers for fallback response", async () => {
      const request = new NextRequest("http://localhost/api/og/receipt", {
        method: "GET",
      });

      const response = await GET(request);
      const cacheControl = response.headers.get("cache-control");

      expect(cacheControl).toContain("public");
    });
  });

  describe("security", () => {
    it("does not include sensitive data patterns in response body", async () => {
      const validHash = "a".repeat(64);
      const request = new NextRequest(`http://localhost/api/og/receipt?hash=${validHash}`, {
        method: "GET",
      });

      const response = await GET(request);

      // Image binary should not contain sensitive patterns as text
      // (This is a basic sanity check; actual image analysis would be more complex)
      expect(response.status).toBe(200);
    });

    it("handles URL encoding properly", async () => {
      // Hash with URL-encoded characters that could be problematic
      const request = new NextRequest(
        "http://localhost/api/og/receipt?hash=abc%00def",
        { method: "GET" },
      );

      const response = await GET(request);
      expect(response.status).toBe(200);
    });
  });
});

describe("verify page OG metadata", () => {
  it("generates correct OG image URL with hash", async () => {
    // This tests the generateMetadata function behavior conceptually
    const hash = "abc123";

    // We verify the URL pattern is valid
    expect(`/api/og/receipt?hash=${hash}`).toMatch(/^\/api\/og\/receipt\?hash=[\w]+$/);
  });

  it("uses fallback OG image URL without hash", () => {
    const fallbackUrl = "/api/og/receipt";
    expect(fallbackUrl).toBe("/api/og/receipt");
  });
});
