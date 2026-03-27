import { NextRequest, NextResponse } from "next/server";
import { sha256 } from "@/lib/hash";
import { consumeRateLimit } from "@/lib/rate-limit";

const TIMEOUT_MS = 8_000;
const RATE_LIMIT_MAX = 10; // per IP per minute — tighter than sandbox since keys persist
const NO_STORE = { "Cache-Control": "no-store" };

function getAtfApiBase(): string {
  return (
    process.env.FIREWALL_API_BASE_URL?.replace(/\/+$/, "") ??
    "https://api.trucore.xyz"
  );
}

function getRequestIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * POST /api/keys/issue
 *
 * Proxies to POST /auth/api-keys/create on the ATF backend.
 * Returns { api_key, label, created_at } — raw key returned once only.
 */
export async function POST(req: NextRequest) {
  const ip = getRequestIp(req);
  const rl = consumeRateLimit(`keys:issue:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX,
    windowMs: 60_000,
  });

  if (rl.exceeded) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Too many key creation requests. Please wait a moment and try again.",
      },
      { status: 429, headers: NO_STORE },
    );
  }

  const atfBase = getAtfApiBase();
  const upstreamUrl = `${atfBase}/auth/api-keys/create`;

  let label = "trucore-site";
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const body = await req.json();
      if (body && typeof body.label === "string") {
        label = body.label.trim().slice(0, 120) || "trucore-site";
      }
    }
  } catch {
    // Fall through with default label — non-fatal.
  }

  let upstream: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      upstream = await fetch(upstreamUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    const message = err instanceof Error && err.name === "AbortError"
      ? "ATF backend timed out."
      : "ATF backend unreachable.";
    return NextResponse.json(
      { error: "upstream_error", message },
      { status: 502, headers: NO_STORE },
    );
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "upstream_error", message: "ATF backend returned an error." },
      { status: 502, headers: NO_STORE },
    );
  }

  let data: unknown;
  try {
    data = await upstream.json();
  } catch {
    return NextResponse.json(
      { error: "upstream_error", message: "Invalid response from ATF backend." },
      { status: 502, headers: NO_STORE },
    );
  }

  return NextResponse.json(data, { status: 200, headers: NO_STORE });
}
