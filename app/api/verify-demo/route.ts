import { NextRequest, NextResponse } from "next/server";
import { sha256 } from "@/lib/hash";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  FALLBACK_RESULT,
  buildVerifyJson,
  type ProtectResult,
} from "@/lib/verify-demo-data";

const TIMEOUT_MS = 8_000;
const RATE_LIMIT_MAX = 20;
const NO_STORE = { "Cache-Control": "no-store" } as const;

function getAtfApiBase(): string {
  return (
    process.env.FIREWALL_API_BASE_URL?.replace(/\/+$/, "") ??
    process.env.NEXT_PUBLIC_ATF_API_URL?.replace(/\/+$/, "") ??
    "https://api.trucore.xyz"
  );
}

function getRequestIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(req: NextRequest) {
  const ip = getRequestIp(req);
  const rl = consumeRateLimit(`verify-demo:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX,
    windowMs: 60_000,
  });

  if (rl.exceeded) {
    return NextResponse.json(
      { error: "rate_limited", message: "Rate limit reached. Please wait a moment and try again." },
      { status: 429, headers: NO_STORE },
    );
  }

  const base = getAtfApiBase();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const intentRes = await fetch(`${base}/sandbox/sample-intent`, {
      signal: controller.signal,
    });
    if (!intentRes.ok) throw new Error(`sample-intent ${intentRes.status}`);
    const intent: unknown = await intentRes.json();

    const protectRes = await fetch(`${base}/sandbox/protect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intent),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!protectRes.ok) throw new Error(`protect ${protectRes.status}`);

    const data: ProtectResult = await protectRes.json();
    return NextResponse.json(buildVerifyJson(data, "live"), { headers: NO_STORE });
  } catch {
    clearTimeout(timer);
    return NextResponse.json(buildVerifyJson(FALLBACK_RESULT, "fallback"), { headers: NO_STORE });
  }
}
