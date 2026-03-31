import { NextRequest, NextResponse } from "next/server";
import { sha256 } from "@/lib/hash";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getAtfApiBaseUrl, joinUpstreamUrl, getRequestIp, classifyUpstreamStatus } from "@/lib/server/upstream";
import { logSecurityEvent } from "@/lib/security-log";

const TIMEOUT_MS = 12_000;
const RATE_LIMIT_MAX = 30; // per IP per minute
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  const ip = getRequestIp(req);
  const rl = consumeRateLimit(`customer:receipts:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX,
    windowMs: 60_000,
  });

  if (rl.exceeded) {
    return NextResponse.json(
      { error: "rate_limited", message: "Rate limit reached. Please wait a moment and try again." },
      { status: 429, headers: NO_STORE },
    );
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json(
      { error: "unauthorized", message: "Authentication required." },
      { status: 401, headers: NO_STORE },
    );
  }

  // Forward query params to upstream
  const { searchParams } = new URL(req.url);
  const queryString = searchParams.toString();
  const upstreamPath = `/customer/receipts${queryString ? `?${queryString}` : ""}`;
  const upstream = joinUpstreamUrl(getAtfApiBaseUrl(), upstreamPath);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
      if (process.env.NODE_ENV !== "production") {
        console.log("[proxy] customer/receipts → upstream:", upstream);
        console.log("[proxy] customer/receipts → auth header present:", !!authHeader);
      }
    const res = await fetch(upstream, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    const body = await res.text();

    if (!res.ok) {
      const failureClass = classifyUpstreamStatus(res.status);
      logSecurityEvent("customer_route_failure", {
        ip,
        meta: {
          route: "customer/receipts",
          upstream_target: "atf-api",
          failure_class: failureClass,
          status: res.status,
          environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
        },
      });
    }

    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json",
        ...NO_STORE,
      },
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    logSecurityEvent("customer_route_failure", {
      ip,
      meta: {
        route: "customer/receipts",
        upstream_target: "atf-api",
        failure_class: isTimeout ? "timeout" : "network_error",
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      },
    });
    return NextResponse.json(
      {
        error: isTimeout ? "upstream_timeout" : "upstream_unavailable",
        message: isTimeout
          ? "The upstream receipts service did not respond in time."
          : "Receipts service is temporarily unavailable.",
      },
      { status: 502, headers: NO_STORE },
    );
  }
}
