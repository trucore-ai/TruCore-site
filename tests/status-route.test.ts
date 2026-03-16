import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/status/route";
import { _resetRateLimitBuckets } from "@/lib/rate-limit";

describe("/api/status firewall reachability", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    _resetRateLimitBuckets();
    process.env.FIREWALL_API_BASE_URL = "http://firewall.local";
  });

  afterEach(() => {
    _resetRateLimitBuckets();
  });

  it("reports firewall reachable when health endpoint returns 200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("ok", {
        status: 200,
      }),
    );

    const request = new NextRequest("http://localhost/api/status", {
      method: "GET",
      headers: {
        "x-forwarded-for": "203.0.113.10",
      },
    });

    const response = await GET(request);
    const payload = (await response.json()) as {
      ok: boolean;
      firewall_api: { configured: boolean; reachable: boolean };
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.firewall_api.configured).toBe(true);
    expect(payload.firewall_api.reachable).toBe(true);
  });

  it("does not leak firewall base URL in response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("ok", { status: 200 }),
    );

    const request = new NextRequest("http://localhost/api/status", {
      method: "GET",
      headers: { "x-forwarded-for": "203.0.113.11" },
    });

    const response = await GET(request);
    const text = await response.text();

    expect(text).not.toContain("firewall.local");
    expect(text).not.toContain("base_url");
  });

  it("keeps service ok when firewall health check fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("timeout"));

    const request = new NextRequest("http://localhost/api/status", {
      method: "GET",
      headers: {
        "x-forwarded-for": "198.51.100.20",
      },
    });

    const response = await GET(request);
    const payload = (await response.json()) as {
      ok: boolean;
      firewall_api: { configured: boolean; reachable: boolean };
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.firewall_api.configured).toBe(true);
    expect(payload.firewall_api.reachable).toBe(false);
  });
});
