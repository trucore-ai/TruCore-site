import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/simulate/route";

describe("/api/simulate proxy", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.FIREWALL_API_BASE_URL = "http://firewall.local";
    delete process.env.FIREWALL_API_API_KEY;
  });

  it("proxies to firewall-api and preserves content_hash", async () => {
    const upstreamPayload = {
      decision: "approve",
      reasons: ["within policy constraints"],
      content_hash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      receipt_hash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      policy_hash: "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
      params: { tier: "public" },
    };

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(upstreamPayload), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      }),
    );

    const requestBody = {
      action: "swap",
      token_in: "SOL",
      token_out: "USDC",
      amount: 10,
      max_slippage_bps: 100,
      ttl_seconds: 60,
    };

    const request = new NextRequest("http://localhost/api/simulate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      ok: boolean;
      decision: string;
      reasons: string[];
      content_hash: string;
      receipt_hash: string;
      policy_hash: string;
      params: Record<string, unknown>;
      result: {
        status: string;
        content_hash: string;
        receipt_hash: string;
      };
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.decision).toBe("approve");
    expect(payload.reasons).toEqual(["within policy constraints"]);
    expect(payload.content_hash).toBe(upstreamPayload.content_hash);
    expect(payload.receipt_hash).toBe(upstreamPayload.receipt_hash);
    expect(payload.policy_hash).toBe(upstreamPayload.policy_hash);
    expect(payload.params).toEqual(upstreamPayload.params);
    expect(payload.result.status).toBe("allowed");
    expect(payload.result.content_hash).toBe(upstreamPayload.content_hash);
    expect(payload.result.receipt_hash).toBe(upstreamPayload.receipt_hash);

    expect(response.headers.get("x-ratelimit-limit")).toBeTruthy();
    expect(response.headers.get("x-ratelimit-remaining")).toBeTruthy();
    expect(response.headers.get("x-ratelimit-reset")).toBeTruthy();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("http://firewall.local/v1/intents/approve");
    expect(init).toMatchObject({ method: "POST" });
    expect(JSON.parse(String(init?.body))).toEqual(requestBody);
  });

  it("falls back to local policy evaluation when upstream fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    const request = new NextRequest("http://localhost/api/simulate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        action: "swap",
        token_in: "SOL",
        token_out: "USDC",
        amount: 10,
        max_slippage_bps: 100,
        ttl_seconds: 60,
      }),
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      ok: boolean;
      decision: string;
      result: { status: string };
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.decision).toBe("approve");
    expect(payload.result.status).toBe("allowed");
    expect(response.headers.get("x-ratelimit-limit")).toBeTruthy();
  });

  it("falls back to local policy and denies when amount exceeds limit", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    const request = new NextRequest("http://localhost/api/simulate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        action: "swap",
        token_in: "SOL",
        token_out: "USDC",
        amount: 5000,
        max_slippage_bps: 100,
        ttl_seconds: 60,
      }),
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      ok: boolean;
      decision: string;
      result: { status: string };
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.decision).toBe("deny");
    expect(payload.result.status).toBe("denied");
  });

  it("falls back to local policy when firewall API is unconfigured", async () => {
    delete process.env.FIREWALL_API_BASE_URL;

    const request = new NextRequest("http://localhost/api/simulate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        action: "swap",
        token_in: "SOL",
        token_out: "USDC",
        amount: 10,
        max_slippage_bps: 100,
        ttl_seconds: 60,
      }),
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      ok: boolean;
      result: { status: string };
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.result.status).toBe("allowed");
  });
});
