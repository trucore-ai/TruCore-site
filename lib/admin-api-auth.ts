/**
 * Centralized server-only wrapper for admin API route handlers.
 *
 * Provides:
 * - Session validation via assertAdminSession()
 * - CSRF Origin check for cookie-authenticated POST/PUT/PATCH/DELETE
 * - Protected-response hardening headers (no-store, nosniff, referrer)
 * - Structured security logging on denial
 * - Generic external error responses (no detail leakage)
 *
 * Usage:
 *   export const POST = withAdminApiAuth(async (request) => {
 *     // handler body — session is already validated
 *     return NextResponse.json({ ok: true });
 *   });
 */

import { NextRequest, NextResponse } from "next/server";
import { assertAdminSession } from "./admin-auth";
import { logSecurityEvent } from "./security-log";
import { isOriginValid, getRequestIp } from "./security/origin";

/* ---------- protected response headers ---------- */

/**
 * Headers applied to every admin API response.
 * Prevents caching and adds conservative hardening directives.
 */
export const ADMIN_RESPONSE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
};

/**
 * Apply admin hardening headers to an existing Response / NextResponse.
 */
export function applyAdminHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(ADMIN_RESPONSE_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

/* ---------- CSRF / Origin verification ---------- */

/* isOriginValid and getRequestIp are now imported from lib/security/origin.ts */

/* ---------- generic denial responses ---------- */

function denyJson(status: number = 404): NextResponse {
  const res = NextResponse.json({ error: "not_found" }, { status });
  return applyAdminHeaders(res);
}

/* ---------- wrapper ---------- */

type AdminApiHandler = (
  request: NextRequest,
  context?: unknown,
) => Promise<NextResponse> | NextResponse;

/**
 * Wrap an admin API route handler with centralized auth, CSRF,
 * header hardening, and security logging.
 *
 * Options:
 * - `csrf` (default: true for mutation methods) — enforce Origin check
 */
export function withAdminApiAuth(
  handler: AdminApiHandler,
  options?: { csrf?: boolean },
): AdminApiHandler {
  const enforceCsrf = options?.csrf ?? true;

  return async (request: NextRequest, context?: unknown) => {
    const ip = getRequestIp(request);

    /* ── CSRF / Origin check (mutation methods only) ──── */
    if (enforceCsrf && !isOriginValid(request)) {
      logSecurityEvent("csrf_origin_rejected", {
        ip,
        meta: {
          method: request.method,
          path: request.nextUrl.pathname,
        },
      });
      return denyJson();
    }

    /* ── Session validation ──── */
    try {
      await assertAdminSession();
    } catch {
      logSecurityEvent("admin_api_denied", {
        ip,
        meta: { path: request.nextUrl.pathname },
      });
      return denyJson();
    }

    /* ── Run the actual handler ──── */
    try {
      const response = await handler(request, context);
      return applyAdminHeaders(response);
    } catch {
      logSecurityEvent("admin_api_degraded", {
        ip,
        meta: {
          route: request.nextUrl.pathname,
          reason: "unhandled_handler_error",
        },
      });
      const res = NextResponse.json(
        { error: "temporarily_unavailable" },
        { status: 500 },
      );
      return applyAdminHeaders(res);
    }
  };
}
