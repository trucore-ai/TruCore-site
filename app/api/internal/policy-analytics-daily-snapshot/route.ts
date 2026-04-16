/**
 * Internal scheduled route — daily policy analytics snapshot capture.
 *
 * Invoked by Vercel cron once per day (see vercel.json).
 * Also callable manually by ops with the CRON_SECRET token.
 *
 * Behaviour:
 *   1. Duplicate guard: if a snapshot was already captured within the
 *      last 23 hours, skip capture and return 200 with skipped=true.
 *   2. Capture: call persistSnapshot() — reuses the existing snapshot
 *      build + write path, no logic duplication.
 *   3. Prune: delete snapshots older than SNAPSHOT_RETENTION_DAYS
 *      (default: 90), always preserving the two newest rows.
 *
 * Authorization: CRON_SECRET (Bearer token, same pattern as health-monitor).
 * Exposure: internal / ops-only; never customer-facing.
 *
 * Environment variables:
 *   CRON_SECRET              - shared secret set by Vercel for cron jobs
 *   SNAPSHOT_RETENTION_DAYS  - retention window in days (default: 90)
 */

import { NextRequest, NextResponse } from "next/server";
import { persistSnapshot } from "@/lib/server/policy-analytics-store";
import {
  getSnapshotCapturedAfter,
  deleteSnapshotsOlderThan,
} from "@/lib/db";

/** How far back to look for a recent snapshot before skipping capture. */
const DUPLICATE_WINDOW_HOURS = 23;

/** Default snapshot retention in days. */
const DEFAULT_RETENTION_DAYS = 90;

function getRetentionDays(): number {
  const raw = process.env.SNAPSHOT_RETENTION_DAYS;
  if (!raw) return DEFAULT_RETENTION_DAYS;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RETENTION_DAYS;
}

export async function GET(request: NextRequest) {
  // ── Authorization ────────────────────────────────────────────────────────
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const retentionDays = getRetentionDays();
  const now = new Date();

  // ── Duplicate guard ───────────────────────────────────────────────────────
  let skipped = false;
  let existingId: string | null = null;
  try {
    const windowStart = new Date(
      now.getTime() - DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000,
    );
    const recent = await getSnapshotCapturedAfter(windowStart);
    if (recent) {
      skipped = true;
      existingId = recent.id;
      console.log(
        `[policy-analytics-daily-snapshot] Skipping — recent snapshot found: ${recent.id} captured_at=${recent.created_at}`,
      );
    }
  } catch (err) {
    // DB check failure: proceed with capture anyway (fail-open for automation)
    console.warn("[policy-analytics-daily-snapshot] Duplicate check failed, proceeding:", err);
  }

  // ── Capture ───────────────────────────────────────────────────────────────
  let snapshotId: string | null = null;
  let capturedAt: string | null = null;
  let captureError: string | null = null;

  if (!skipped) {
    try {
      const payload = await persistSnapshot();
      capturedAt = payload.captured_at;
      // persistSnapshot returns the payload; the row id comes from the DB write.
      // We fetch the latest meta to surface the new row id in the response.
      const { getLatestSnapshotMeta } = await import(
        "@/lib/server/policy-analytics-store"
      );
      const meta = await getLatestSnapshotMeta();
      snapshotId = meta?.id ?? null;
      console.log(
        `[policy-analytics-daily-snapshot] Snapshot captured: id=${snapshotId} captured_at=${capturedAt}`,
      );
    } catch (err) {
      captureError = err instanceof Error ? err.message : String(err);
      console.error(
        "[policy-analytics-daily-snapshot] Capture failed:",
        captureError,
      );
    }
  }

  // ── Retention pruning ─────────────────────────────────────────────────────
  let pruned = 0;
  let pruneError: string | null = null;
  try {
    pruned = await deleteSnapshotsOlderThan(retentionDays);
    if (pruned > 0) {
      console.log(
        `[policy-analytics-daily-snapshot] Pruned ${pruned} snapshot(s) older than ${retentionDays} days.`,
      );
    }
  } catch (err) {
    pruneError = err instanceof Error ? err.message : String(err);
    console.error(
      "[policy-analytics-daily-snapshot] Pruning failed:",
      pruneError,
    );
  }

  // ── Response ──────────────────────────────────────────────────────────────
  const ok = captureError === null;
  return NextResponse.json(
    {
      ok,
      skipped,
      ...(skipped ? { existing_snapshot_id: existingId } : {}),
      ...(snapshotId ? { snapshot_id: snapshotId } : {}),
      ...(capturedAt ? { captured_at: capturedAt } : {}),
      ...(captureError ? { capture_error: captureError } : {}),
      retention_days: retentionDays,
      pruned,
      ...(pruneError ? { prune_error: pruneError } : {}),
    },
    {
      status: captureError ? 500 : 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
