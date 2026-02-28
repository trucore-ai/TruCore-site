import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/status/route";

describe("/api/status firewall reachability", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.FIREWALL_API_BASE_URL = "http://firewall.local";
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
      firewall_api: { base_url: string | null; reachable: boolean };
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.firewall_api.base_url).toBe("http://firewall.local");
    expect(payload.firewall_api.reachable).toBe(true);
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
      firewall_api: { base_url: string | null; reachable: boolean };
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.firewall_api.base_url).toBe("http://firewall.local");
    expect(payload.firewall_api.reachable).toBe(false);
  });
});
