/**
 * Public read-only proof packet API route.
 *
 * GET /api/proof/packet?hash=<hash>
 *
 * Returns a sanitized, canonical, versioned proof packet suitable for
 * developers, agents, and external tools. Read-only and intentionally public.
 *
 * Allowed fields:
 *   - version, type, status
 *   - proof.hash, proof.decision, proof.verified, proof.created_at
 *   - links.verify_url, links.og_preview_url
 *   - meta.exported_at, meta.source
 *
 * Not exposed:
 *   - addresses, policy internals, secrets, tokens, backend metadata
 */

import { NextRequest, NextResponse } from "next/server";
import {
  buildProofPacket,
  PROOF_PACKET_VERSION,
  PROOF_PACKET_TYPE,
} from "@/lib/proof-packet";
import { isReceiptHashFormatValid } from "@/lib/receipt-verification";

/** Response envelope for success case. */
export interface PublicProofPacketResponse {
  status: "ok";
  data: ReturnType<typeof buildProofPacket>;
}

/** Response envelope for error case. */
export interface PublicProofPacketErrorResponse {
  status: "error";
  error: {
    code: string;
    message: string;
  };
}

/** Cache control for public, static-ish responses. */
const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
} as const;

/** Cache control for error responses — no caching. */
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

/**
 * Create a standardized error response.
 */
function errorResponse(
  code: string,
  message: string,
  status: number,
): NextResponse<PublicProofPacketErrorResponse> {
  return NextResponse.json(
    {
      status: "error" as const,
      error: { code, message },
    },
    { status, headers: NO_STORE_HEADERS },
  );
}

/**
 * Sanitize and validate a hash parameter.
 *
 * Returns null if:
 *   - missing or empty
 *   - not a valid hex string
 *   - not exactly 64 characters (SHA-256)
 */
function sanitizeHash(raw: string | null): string | null {
  if (!raw || typeof raw !== "string") return null;

  const trimmed = raw.trim().toLowerCase();
  if (!isReceiptHashFormatValid(trimmed)) return null;

  return trimmed;
}

/**
 * GET /api/proof/packet?hash=<hash>
 *
 * Public, read-only endpoint returning a sanitized proof packet.
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<PublicProofPacketResponse | PublicProofPacketErrorResponse>> {
  const url = new URL(request.url);
  const rawHash = url.searchParams.get("hash");

  // Missing hash parameter
  if (rawHash === null || rawHash === "") {
    return errorResponse(
      "missing_hash",
      "The 'hash' query parameter is required.",
      400,
    );
  }

  // Invalid hash format
  const hash = sanitizeHash(rawHash);
  if (hash === null) {
    return errorResponse(
      "invalid_hash",
      "The 'hash' parameter must be a valid 64-character hex string (SHA-256).",
      400,
    );
  }

  // Build proof packet using existing logic — no field duplication
  const packet = buildProofPacket(hash);

  // Validate packet was built successfully (fail-closed)
  if (
    packet.version !== PROOF_PACKET_VERSION ||
    packet.type !== PROOF_PACKET_TYPE ||
    packet.status !== "success" ||
    !packet.proof?.hash ||
    !packet.links?.verify_url
  ) {
    return errorResponse(
      "packet_build_failed",
      "Unable to construct proof packet. Please try again.",
      500,
    );
  }

  return NextResponse.json(
    {
      status: "ok" as const,
      data: packet,
    },
    { headers: CACHE_HEADERS },
  );
}
