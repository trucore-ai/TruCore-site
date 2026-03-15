"use server";

import { withAdminAction } from "@/lib/admin-action-auth";
import {
  updateWaitlistSignupStatus,
  updateWaitlistAdminNotes,
  listDesignPartnerSignups,
  PIPELINE_STATUSES,
  type PipelineStatus,
} from "@/lib/db";
import { toCsv } from "@/lib/csv";
import { assertRateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/audit-log";

/* ---------- Status update ---------- */

export async function setSignupStatus(formData: FormData) {
  return withAdminAction(async () => {
    assertRateLimit("admin");

    const email = formData.get("email") as string | null;
    const status = formData.get("status") as string | null;

    if (!email || !status) {
      return { error: "missing fields" };
    }

    if (!PIPELINE_STATUSES.includes(status as PipelineStatus)) {
      return { error: "invalid status" };
    }

    const updated = await updateWaitlistSignupStatus({
      email,
      status: status as PipelineStatus,
    });

    await logAdminAction({
      action: "status_change",
      targetEmail: email,
      metadata: { to: status },
    });

    return { ok: true, updated };
  });
}

/* ---------- Admin notes update ---------- */

const MAX_NOTES_LEN = 2000;

export async function updateAdminNotes(formData: FormData) {
  return withAdminAction(async () => {
    assertRateLimit("admin");

    const email = formData.get("email") as string | null;
    const notes = formData.get("notes") as string | null;

    if (!email) {
      return { error: "missing email" };
    }

    const sanitised = (notes ?? "").slice(0, MAX_NOTES_LEN);

    const updated = await updateWaitlistAdminNotes({
      email,
      notes: sanitised,
    });

    await logAdminAction({
      action: "note_update",
      targetEmail: email,
    });

    return { ok: true, updated };
  });
}

/* ---------- CSV export ---------- */

const CSV_HEADERS = [
  "created_at",
  "updated_at",
  "email",
  "status",
  "project_name",
  "integrations_interest",
  "tx_volume_bucket",
  "build_stage",
  "role",
  "source",
  "admin_notes",
] as const;

export async function exportDesignPartnersCsv(formData: FormData) {
  void formData; // no fields needed, auth via cookie

  return withAdminAction(async () => {
    assertRateLimit("admin");

    const rows = await listDesignPartnerSignups();
    const csv = toCsv(rows, [...CSV_HEADERS]);

    await logAdminAction({
      action: "csv_export",
      metadata: { rowCount: rows.length },
    });

    return { csv, filename: `trucore-design-partners-${Date.now()}.csv` };
  });
}
