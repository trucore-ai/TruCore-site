import { NextRequest, NextResponse } from "next/server";
import { ensureCspReportsTable, getSQL } from "@/lib/db";
import { sha256 } from "@/lib/hash";
import { assertRateLimit } from "@/lib/rate-limit";

/**
 * CSP violation report collector.
 *
 * Accepts:
 * - Standard Reporting API v1 (application/reports+json)
 * - Legacy report-uri format (application/csp-report)
 * - Plain JSON fallback
 *
 * Redactions applied before storage:
 * - document-uri stripped to origin only (scheme+host)
 * - blocked-uri not stored
 * - source-file not stored
 * - No query strings or hashes stored
 */

function stripToOrigin(uri: string | undefined | null): string | null {
  if (!uri) return null;
  try {
    const u = new URL(uri);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

function truncate(val: string | undefined | null, max: number): string | null {
  if (!val) return null;
  return val.length > max ? val.slice(0, max) : val;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractReport(body: any): {
  effectiveDirective: string | null;
  violatedDirective: string | null;
  disposition: string | null;
  documentOrigin: string | null;
} {
  // Reporting API v1 wraps in body.body or body[0].body
  const inner = body?.body ?? body?.["csp-report"] ?? body;
  return {
    effectiveDirective: inner?.["effective-directive"] ?? inner?.effectiveDirective ?? null,
    violatedDirective: inner?.["violated-directive"] ?? inner?.violatedDirective ?? null,
    disposition: inner?.disposition ?? "enforce",
    documentOrigin: stripToOrigin(
      inner?.["document-uri"] ?? inner?.documentURL ?? inner?.documentUri,
    ),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function POST(request: NextRequest) {
  // Rate limit by IP hash (30/min)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const ipKey = `csp:${sha256(ip)}`;

  try {
    assertRateLimit(ipKey, { max: 30, windowMs: 60_000 });
  } catch {
    return new NextResponse(null, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  // Reporting API may send an array of reports
  const reports = Array.isArray(payload) ? payload : [payload];

  try {
    await ensureCspReportsTable();
    const sql = getSQL();
    const ua = truncate(request.headers.get("user-agent"), 120);

    for (const report of reports.slice(0, 5)) {
      const { effectiveDirective, violatedDirective, disposition, documentOrigin } =
        extractReport(report);

      await sql`
        INSERT INTO csp_reports (effective_directive, violated_directive, disposition, document_origin, user_agent)
        VALUES (${effectiveDirective}, ${violatedDirective}, ${disposition}, ${documentOrigin}, ${ua});
      `;
    }
  } catch (err) {
    console.error("[csp-report] write failed:", err);
  }

  return new NextResponse(null, { status: 204 });
}
