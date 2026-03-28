/**
 * Customer upgrade requests proxy route - list and request.
 *
 * GET /api/customer/upgrades - list upgrade requests (authenticated)
 * POST /api/customer/upgrades - submit upgrade request (authenticated)
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
const RATE_LIMIT_MAX_LIST = 30;
const RATE_LIMIT_MAX_CREATE = 5;
const MAX_BODY_BYTES = 8 * 1024;
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  const ip = getRequestIp(req);
  const rl = consumeRateLimit(`customer:upgrades:list:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX_LIST,
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

  const upstream = joinUpstreamUrl(getAtfApiBaseUrl(), "/customer/upgrades");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
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
          route: "customer/upgrades",
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
        route: "customer/upgrades",
        upstream_target: "atf-api",
        failure_class: "network_error",
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      },
    });
    return NextResponse.json(
      { error: "upstream_unavailable", message: "Upgrades service is temporarily unavailable." },
      { status: 502, headers: NO_STORE },
    );
  }
}

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req);
  const rl = consumeRateLimit(`customer:upgrades:create:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX_CREATE,
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

  const ct = req.headers.get("content-type") ?? "";
  if (!ct.toLowerCase().includes("application/json")) {
    return NextResponse.json(
      { error: "invalid_content_type", message: "Content-Type must be application/json." },
      { status: 400, headers: NO_STORE },
    );
  }

  let bodyText: string;
  try {
    bodyText = await req.text();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Could not read request body." },
      { status: 400, headers: NO_STORE },
    );
  }

  if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "payload_too_large", message: "Request body too large." },
      { status: 413, headers: NO_STORE },
    );
  }

  try {
    JSON.parse(bodyText);
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Request body must be valid JSON." },
      { status: 400, headers: NO_STORE },
    );
  }

  const upstream = joinUpstreamUrl(getAtfApiBaseUrl(), "/customer/upgrades/request");
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

    if (!res.ok) {
      const failureClass = classifyUpstreamStatus(res.status);
      logSecurityEvent("customer_route_failure", {
        ip,
        meta: {
          route: "customer/upgrades/request",
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
        route: "customer/upgrades/request",
        upstream_target: "atf-api",
        failure_class: "network_error",
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      },
    });
    return NextResponse.json(
      { error: "upstream_unavailable", message: "Upgrades service is temporarily unavailable." },
      { status: 502, headers: NO_STORE },
    );
  }
}
