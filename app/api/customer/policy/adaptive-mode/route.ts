/**
 * Customer adaptive PIL mode proxy route.
 *
 * PATCH /api/customer/policy/adaptive-mode
 * Proxies PATCH /v1/policy/adaptive-mode on ATF API.
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

export async function PATCH(req: NextRequest) {
  const ip = getRequestIp(req);
  const rl = consumeRateLimit(`customer:policy:adaptive-mode:${sha256(ip)}`, {
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

  let bodyText = "";
  try {
    bodyText = await req.text();
    JSON.parse(bodyText || "{}");
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be valid JSON." },
      { status: 400, headers: NO_STORE },
    );
  }

  const upstream = joinUpstreamUrl(getAtfApiBaseUrl(), "/v1/policy/adaptive-mode");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(upstream, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: bodyText,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const body = await res.text();

    if (!res.ok) {
      const failureClass = classifyUpstreamStatus(res.status);
      logSecurityEvent("customer_route_failure", {
        ip,
        meta: {
          route: "customer/policy/adaptive-mode",
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
        route: "customer/policy/adaptive-mode",
        upstream_target: "atf-api",
        failure_class: "timeout_or_network",
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      },
    });
    return NextResponse.json(
      { error: "service_unavailable", message: "Policy service is temporarily unavailable." },
      { status: 502, headers: NO_STORE },
    );
  }
}
