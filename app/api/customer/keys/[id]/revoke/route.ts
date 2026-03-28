/**
 * Customer API key revoke proxy route.
 *
 * POST /api/customer/keys/[id]/revoke - revoke key (authenticated)
 */

import { NextRequest, NextResponse } from "next/server";
import { sha256 } from "@/lib/hash";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  getAtfApiBaseUrl,
  joinUpstreamUrl,
  getRequestIp,
  classifyUpstreamStatus,
} from "@/lib/server/upstream";
import { logSecurityEvent } from "@/lib/security-log";

const TIMEOUT_MS = 8_000;
const RATE_LIMIT_MAX = 10;
const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ip = getRequestIp(req);
  const rl = consumeRateLimit(`customer:keys:revoke:${sha256(ip)}`, {
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

  const upstream = joinUpstreamUrl(
    getAtfApiBaseUrl(),
    `/customer/keys/${encodeURIComponent(id)}/revoke`,
  );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(upstream, {
      method: "POST",
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
          route: "customer/keys/revoke",
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
  } catch {
    clearTimeout(timer);
    logSecurityEvent("customer_route_failure", {
      ip,
      meta: {
        route: "customer/keys/revoke",
        upstream_target: "atf-api",
        failure_class: "network_error",
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      },
    });
    return NextResponse.json(
      { error: "upstream_unavailable", message: "API keys service is temporarily unavailable." },
      { status: 502, headers: NO_STORE },
    );
  }
}
