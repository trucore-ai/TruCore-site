import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { _resetRateLimitBuckets } from "@/lib/rate-limit";

async function importRoute() {
  vi.resetModules();
  return import("@/app/api/version/route");
}

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/version", {
    method: "GET",
    headers: { "x-forwarded-for": "203.0.113.50" },
  });
}

describe("/api/version build provenance endpoint", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetRateLimitBuckets();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    _resetRateLimitBuckets();
  });

  it("returns 200 with stable JSON keys", async () => {
    vi.stubEnv("NEXT_PUBLIC_GIT_COMMIT", "abc1234def5678");
    vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", "2025-06-01T12:00:00Z");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("VERCEL_DEPLOYMENT_ID", "dpl_abc123");

    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toHaveProperty("app");
    expect(payload).toHaveProperty("environment");
    expect(payload).toHaveProperty("git_commit");
    expect(payload).toHaveProperty("build_time");
    expect(payload).toHaveProperty("vercel_env");
    expect(payload).toHaveProperty("deployment_id");
  });

  it("app field is always 'trucore-site'", async () => {
    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const payload = await response.json();

    expect(payload.app).toBe("trucore-site");
  });

  it("returns git_commit from NEXT_PUBLIC_GIT_COMMIT", async () => {
    vi.stubEnv("NEXT_PUBLIC_GIT_COMMIT", "deadbeef12345678");

    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const payload = await response.json();

    expect(payload.git_commit).toBe("deadbeef12345678");
  });

  it("falls back to VERCEL_GIT_COMMIT_SHA when NEXT_PUBLIC_GIT_COMMIT is empty", async () => {
    vi.stubEnv("NEXT_PUBLIC_GIT_COMMIT", "");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "fallbacksha123");

    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const payload = await response.json();

    expect(payload.git_commit).toBe("fallbacksha123");
  });

  it("returns null for git_commit when no commit env is available", async () => {
    vi.stubEnv("NEXT_PUBLIC_GIT_COMMIT", "");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "");

    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const payload = await response.json();

    expect(payload.git_commit).toBeNull();
  });

  it("returns null for build_time when env is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", "");

    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const payload = await response.json();

    expect(payload.build_time).toBeNull();
  });

  it("returns environment from VERCEL_ENV", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");

    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const payload = await response.json();

    expect(payload.environment).toBe("preview");
    expect(payload.vercel_env).toBe("preview");
  });

  it("falls back to NODE_ENV when VERCEL_ENV is absent", async () => {
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NODE_ENV", "development");

    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const payload = await response.json();

    expect(payload.environment).toBe("development");
  });

  it("returns 'unknown' when no environment env is set", async () => {
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NODE_ENV", "");

    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const payload = await response.json();

    expect(payload.environment).toBe("unknown");
  });

  it("does not expose secrets or env dumps", async () => {
    vi.stubEnv("NEXT_PUBLIC_GIT_COMMIT", "abc123");
    vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", "2025-06-01T00:00:00Z");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "re_secret_test");
    vi.stubEnv("ADMIN_SECRET", "supersecret");

    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const text = await response.text();

    expect(text).not.toContain("re_secret_test");
    expect(text).not.toContain("supersecret");
    expect(text).not.toContain("RESEND_API_KEY");
    expect(text).not.toContain("ADMIN_SECRET");
  });

  it("response has only the expected keys", async () => {
    vi.stubEnv("NEXT_PUBLIC_GIT_COMMIT", "abc123");

    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const payload = await response.json();

    const keys = Object.keys(payload).sort();
    expect(keys).toEqual([
      "app",
      "build_time",
      "deployment_id",
      "environment",
      "git_commit",
      "vercel_env",
    ]);
  });

  it("sets Cache-Control: no-store header", async () => {
    const { GET } = await importRoute();
    const response = await GET(makeRequest());

    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("all values are string or null", async () => {
    vi.stubEnv("NEXT_PUBLIC_GIT_COMMIT", "abc123");
    vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", "2025-06-01T00:00:00Z");
    vi.stubEnv("VERCEL_ENV", "production");

    const { GET } = await importRoute();
    const response = await GET(makeRequest());
    const payload = await response.json();

    for (const [, value] of Object.entries(payload)) {
      expect(value === null || typeof value === "string").toBe(true);
    }
  });
});
