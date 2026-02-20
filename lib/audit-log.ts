/**
 * Lightweight admin action audit logger (DB-backed).
 *
 * Writes to the admin_audit_log table. Never stores secrets,
 * raw cookies, or the ADMIN_DASHBOARD_KEY.
 */

import { ensureAuditLogTable, getSQL } from "./db";

export interface AuditEntry {
  action: string;
  targetEmail?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Record an admin action in the audit log.
 * Failures are swallowed so audit logging never breaks a user flow.
 */
export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    await ensureAuditLogTable();
    const sql = getSQL();
    await sql`
      INSERT INTO admin_audit_log (action, target_email, metadata)
      VALUES (
        ${entry.action},
        ${entry.targetEmail ?? null},
        ${entry.metadata ? JSON.stringify(entry.metadata) : null}
      );
    `;
  } catch (err) {
    // Never let audit writes break admin actions
    console.error("[audit-log] write failed:", err);
  }
}

export interface AuditLogRow {
  id: string;
  created_at: string;
  action: string;
  target_email: string | null;
  metadata: Record<string, unknown> | null;
}

/**
 * Read the most recent audit log entries (newest first).
 */
export async function listAuditLogEntries(
  limit = 50,
): Promise<AuditLogRow[]> {
  await ensureAuditLogTable();
  const sql = getSQL();
  const safeLimit = Math.min(Math.max(1, limit), 200);
  const rows = await sql`
    SELECT id, created_at, action, target_email, metadata
    FROM admin_audit_log
    ORDER BY created_at DESC
    LIMIT ${safeLimit};
  `;
  return rows as AuditLogRow[];
}
