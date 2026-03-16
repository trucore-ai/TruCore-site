/**
 * Next.js middleware — centralized coarse gate for admin routes.
 *
 * Session tokens are stored in an in-memory server-side map, so
 * authoritative validation cannot run at the edge. This middleware
 * therefore only checks cookie *presence* as a fast first-pass
 * filter. Authoritative server-side validation in pages/API
 * handlers (assertAdminSession / getAdminSessionFromCookies) is
 * still required and is NOT replaced by this middleware.
 *
 * Fail-closed: missing cookie, missing config, or any unexpected
 * state → redirect to /admin/login.
 */

import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "./lib/admin-constants";

/**
 * Paths under /admin that must remain accessible without a session cookie.
 * Only the login page itself is excluded.
 */
const ADMIN_PUBLIC_PATHS = new Set(["/admin/login"]);

function isAdminPublicPath(pathname: string): boolean {
  return ADMIN_PUBLIC_PATHS.has(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
     * Log via console.warn — middleware runs at the edge so we
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
 * Matcher: run middleware only on /admin paths.
 * Excludes Next.js internals and static files automatically via
 * the negative lookahead recommended by Next.js docs.
 */
export const config = {
  matcher: ["/admin/:path*"],
};
