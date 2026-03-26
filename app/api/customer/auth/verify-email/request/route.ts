import { NextRequest, NextResponse } from "next/server";
import { sha256 } from "@/lib/hash";
import { consumeRateLimit } from "@/lib/rate-limit";

const TIMEOUT_MS = 8_000;
const RATE_LIMIT_MAX = 5; // per IP per minute
const NO_STORE = { "Cache-Control": "no-store" };

function getAtfApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_ATF_API_URL?.replace(/\/+$/, "") ??
    "https://api.trucore.xyz"
  );
}

function getRequestIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req);
  const rl = consumeRateLimit(`customer:auth:verify-email:request:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX,
    windowMs: 60_000,
  });

  if (rl.exceeded) {
    return NextResponse.json(
      {
        error: "rate_limited",
        message: "Too many verification requests. Please wait a moment and try again.",
      },
      { status: 429, headers: NO_STORE },
    );
  }

  // This endpoint requires an Authorization header (must be logged in to request re-send)
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json(
      { error: "unauthorized", message: "Authentication required." },
      { status: 401, headers: NO_STORE },
    );
  }

  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    bodyText = "{}";
  }

  const upstream = `${getAtfApiBase()}/auth/verify-email/request`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: bodyText,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
        ...NO_STORE,
      },
    });
  } catch {
    clearTimeout(timer);
    return NextResponse.json(
      { error: "upstream_unavailable", message: "Email verification service is temporarily unavailable." },
      { status: 502, headers: NO_STORE },
    );
  }
}
