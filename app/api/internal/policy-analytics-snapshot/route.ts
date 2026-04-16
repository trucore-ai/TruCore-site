/**
 * Internal policy analytics snapshot API.
 *
 * POST — capture the current in-memory summary and persist it as a durable
 *        aggregated snapshot in the DB.  Returns the full snapshot JSON.
 *
 * GET  — return the most recently persisted snapshot from the DB as JSON.
 *
 * Access: admin session cookie required (withAdminApiAuth).
 * Output: aggregated-only, privacy-safe — no raw event payloads, no PII.
 * Exposure: internal / ops-only; never customer-facing.
 */

import { NextRequest, NextResponse } from "next/server";
import { withAdminApiAuth } from "@/lib/admin-api-auth";
import {
  persistSnapshot,
} from "@/lib/server/policy-analytics-store";
import {
  getLatestAnalyticsSnapshot,
} from "@/lib/db";

/* ── POST — capture + persist current snapshot ──────────────────────────── */

export const POST = withAdminApiAuth(async (_request: NextRequest) => {
  const payload = await persistSnapshot();

  return NextResponse.json(
    {
      ok: true,
      snapshot: payload,
    },
    { status: 201 },
  );
});

/* ── GET — fetch latest persisted snapshot ──────────────────────────────── */

export const GET = withAdminApiAuth(
  async (_request: NextRequest) => {
    const row = await getLatestAnalyticsSnapshot();

    if (!row) {
      return NextResponse.json(
        { ok: true, snapshot: null, message: "No snapshots persisted yet." },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        id: row.id,
        captured_at: row.created_at,
        summary_version: row.summary_version,
        snapshot: row.snapshot,
      },
      { status: 200 },
    );
  },
  { csrf: false },
);
