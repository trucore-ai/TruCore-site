import { NextRequest, NextResponse } from "next/server";
import {
  runFirstTradeCheck,
  sanitizeCheckResponse,
  FirstTradeCheckResponse,
} from "@/lib/ops-first-trade-check";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

/**
 * GET /api/ops/first-trade-check
 *
 * Internal ops endpoint — runs the first-trade reliability check.
 *
 * Protected by a static ops key header (x-ops-key).
 * Response is sanitized: no secrets, no raw stack traces, no user-specific data.
 *
 * Query params:
 *   ?format=minimal - Returns only status and summary (no stage details)
 */
export async function GET(request: NextRequest) {
  const opsKey = process.env.ATF_OPS_KEY;
  if (!opsKey) {
    return NextResponse.json(
      { status: "error", error: "endpoint_not_configured" },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  const provided = request.headers.get("x-ops-key");
  if (!provided || provided !== opsKey) {
    return NextResponse.json(
      { status: "error", error: "forbidden" },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  // Determine base URL for same-origin calls
  const baseUrl = getSameOriginBaseUrl(request);
  if (!baseUrl) {
    return NextResponse.json(
      { status: "error", error: "cannot_determine_origin" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const result = await runFirstTradeCheck(baseUrl);
    const sanitized = sanitizeCheckResponse(result);

    // Support minimal format for quick status checks
    const format = request.nextUrl.searchParams.get("format");
    if (format === "minimal") {
      return NextResponse.json(
        {
          status: sanitized.status,
          data: {
            checked_at: sanitized.data.checked_at,
            summary: sanitized.data.summary,
          },
        },
        { status: getHttpStatus(sanitized), headers: NO_STORE_HEADERS },
      );
    }

    return NextResponse.json(sanitized, {
      status: getHttpStatus(sanitized),
      headers: NO_STORE_HEADERS,
    });
  } catch {
    return NextResponse.json(
      { status: "error", error: "internal" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}

/**
 * Determine same-origin base URL from request headers.
 */
function getSameOriginBaseUrl(request: NextRequest): string | null {
  // Try to use the host header to construct same-origin URL
  const host = request.headers.get("host");
  if (!host) return null;

  // Determine protocol from x-forwarded-proto or default based on environment
  const proto = request.headers.get("x-forwarded-proto") ?? "https";

  // For localhost, allow http
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : proto;

  return `${protocol}://${host}`;
}

/**
 * Map overall check status to HTTP status code.
 */
function getHttpStatus(result: FirstTradeCheckResponse): number {
  switch (result.status) {
    case "ok":
      return 200;
    case "degraded":
      return 200; // Still successful, but caller should check status field
    case "error":
      return 503; // Service partially unavailable
    default:
      return 200;
  }
}
