import { NextRequest, NextResponse } from "next/server";
import { assertRateLimit } from "@/lib/rate-limit";
import { sha256 } from "@/lib/hash";

const FIREWALL_HEALTH_TIMEOUT_MS = 2_000;

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

function getFirewallApiBaseUrl(): string | null {
  const baseUrl = process.env.FIREWALL_API_BASE_URL?.trim();
  if (!baseUrl) {
    return null;
  }

  return baseUrl.replace(/\/+$/, "");
}

async function checkFirewallReachability(baseUrl: string | null): Promise<boolean> {
  if (!baseUrl) {
    return false;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FIREWALL_HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const ipKey = `status:${sha256(getRequestIp(request))}`;

  try {
    assertRateLimit(ipKey, { max: 60, windowMs: 60_000 });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "rate_limited",
      },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const firewallBaseUrl = getFirewallApiBaseUrl();
  const firewallReachable = await checkFirewallReachability(firewallBaseUrl);

  return NextResponse.json(
    {
      ok: true,
      ts: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      env: process.env.VERCEL_ENV ?? null,
      firewall_api: {
        configured: Boolean(firewallBaseUrl),
        reachable: firewallReachable,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}