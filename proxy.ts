/**
 * Next.js proxy — centralized coarse gate for admin routes.
 *
 * Session tokens are stored in an in-memory server-side map, so
 * authoritative validation cannot run at the edge. This proxy
 * therefore only checks cookie *presence* as a fast first-pass
 * filter. Authoritative server-side validation in pages/API
 * handlers (assertAdminSession / getAdminSessionFromCookies) is
 * still required and is NOT replaced by this proxy.
 *
 * Fail-closed: missing cookie, missing config, or any unexpected
 * state → redirect to /admin/login.
 */

import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "./lib/admin-constants";
import {
  FALLBACK_RESULT,
  buildVerifyJson,
  type ProtectResult,
} from "./lib/verify-demo-data";

/**
 * Paths under /admin that must remain accessible without a session cookie.
 * Only the login page itself is excluded.
 */
const ADMIN_PUBLIC_PATHS = new Set(["/admin/login"]);

function isAdminPublicPath(pathname: string): boolean {
  return ADMIN_PUBLIC_PATHS.has(pathname);
}

/* ── /verify-demo?format=json — agent-readable JSON output ── */

const VERIFY_JSON_TIMEOUT_MS = 6_000;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

async function handleVerifyDemoJson(
  request: NextRequest,
): Promise<NextResponse> {
  const origin = request.nextUrl.origin;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VERIFY_JSON_TIMEOUT_MS);

  try {
    const intentRes = await fetch(
      `${origin}/api/sandbox/sample-intent`,
      { signal: controller.signal },
    );
    if (!intentRes.ok) throw new Error("intent fetch failed");
    const intent: unknown = await intentRes.json();

    const protectRes = await fetch(`${origin}/api/sandbox/protect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intent),
      signal: controller.signal,
    });
    if (!protectRes.ok) throw new Error("protect call failed");
    const data: ProtectResult = await protectRes.json();

    return NextResponse.json(buildVerifyJson(data, "live"), {
      headers: NO_STORE_HEADERS,
    });
  } catch {
    return NextResponse.json(buildVerifyJson(FALLBACK_RESULT, "fallback"), {
      headers: NO_STORE_HEADERS,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* Agent-readable JSON output for /verify-demo */
  if (
    pathname === "/verify-demo" &&
    request.nextUrl.searchParams.get("format") === "json"
  ) {
    return handleVerifyDemoJson(request);
  }

  /* Only guard /admin routes */
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  /* Allow public admin paths (login page) */
  if (isAdminPublicPath(pathname)) {
    return NextResponse.next();
  }

  /* Coarse cookie-presence check — fail closed */
  const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    /*
     * Log via console.warn — proxy runs on the server so we
     * cannot import the full security-log helper (it uses
     * node:crypto). The format mirrors the server-side pattern
     * for grep-friendliness.
     */
    const ts = new Date().toISOString();
    console.warn(
      `[security] ${ts} | event=admin_route_denied | path=${pathname} | reason=no_session_cookie`,
    );

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * Matcher: run proxy only on /admin paths and /verify-demo.
 * Excludes Next.js internals and static files automatically via
 * the negative lookahead recommended by Next.js docs.
 */
export const config = {
  matcher: ["/admin/:path*", "/verify-demo"],
};
