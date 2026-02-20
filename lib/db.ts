import { neon } from "@neondatabase/serverless";

/**
 * Get a SQL query function backed by the Neon serverless driver.
 * Reads POSTGRES_URL (or DATABASE_URL) from env at call-time.
 */
export function getSQL() {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "POSTGRES_URL (or DATABASE_URL) is not configured. " +
      "Add it to .env.local for local dev or to your Vercel environment variables for production."
    );
  }
  return neon(url);
}

/** Cache flag so we only run CREATE TABLE once per cold start */
let tableEnsured = false;

/**
 * Ensure the waitlist_signups table exists.
 * Safe to call on every request. Uses IF NOT EXISTS and
 * skips the DDL after the first successful run per process.
 * Also runs safe ALTER TABLE for design-partner columns.
 */
export async function ensureWaitlistTable() {
  if (tableEnsured) return;

  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS waitlist_signups (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      email         TEXT NOT NULL UNIQUE,
      role          TEXT,
      use_case      TEXT,
      source        TEXT DEFAULT 'homepage',
      user_agent    TEXT,
      ip_hash       TEXT
    );
  `;

  /* ---- Design-partner columns (safe, nullable) ---- */
  await sql`ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS intent TEXT;`;
  await sql`ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS project_name TEXT;`;
  await sql`ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS integrations_interest TEXT[];`;
  await sql`ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS tx_volume_bucket TEXT;`;
  await sql`ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS build_stage TEXT;`;

  /* ---- Pipeline status column (Stage 20) ---- */
  await sql`ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS status TEXT;`;
  await sql`ALTER TABLE waitlist_signups ALTER COLUMN status SET DEFAULT 'new';`;
  await sql`UPDATE waitlist_signups SET status = 'new' WHERE status IS NULL;`;

  /* ---- updated_at + admin_notes columns (Stage 21) ---- */
  await sql`ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;`;
  await sql`ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS admin_notes TEXT;`;
  await sql`ALTER TABLE waitlist_signups ALTER COLUMN updated_at SET DEFAULT now();`;
  await sql`UPDATE waitlist_signups SET updated_at = now() WHERE updated_at IS NULL;`;

  tableEnsured = true;
}

/* ---------- audit log table (Stage 23) ---------- */

let auditTableEnsured = false;

/**
 * Ensure the admin_audit_log table exists.
 * Safe to call on every request; uses IF NOT EXISTS and
 * skips the DDL after the first successful run per process.
 */
export async function ensureAuditLogTable() {
  if (auditTableEnsured) return;

  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      action      TEXT NOT NULL,
      target_email TEXT NULL,
      metadata    JSONB NULL
    );
  `;

  auditTableEnsured = true;
}

/* ---------- CSP reports table (Stage 24) ---------- */

let cspTableEnsured = false;

/**
 * Ensure the csp_reports table exists.
 * Safe to call on every request; uses IF NOT EXISTS and
 * skips the DDL after the first successful run per process.
 */
export async function ensureCspReportsTable() {
  if (cspTableEnsured) return;

  const sql = getSQL();
  await sql`
    CREATE TABLE IF NOT EXISTS csp_reports (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      effective_directive TEXT,
      violated_directive  TEXT,
      disposition         TEXT,
      document_origin     TEXT,
      user_agent          TEXT
    );
  `;

  cspTableEnsured = true;
}

export interface CspReportRow {
  id: string;
  created_at: string;
  effective_directive: string | null;
  violated_directive: string | null;
  disposition: string | null;
  document_origin: string | null;
  user_agent: string | null;
}

/**
 * Read the most recent CSP violation reports (newest first).
 */
export async function listCspReports(limit = 50): Promise<CspReportRow[]> {
  await ensureCspReportsTable();
  const sql = getSQL();
  const safeLimit = Math.min(Math.max(1, limit), 200);
  const rows = await sql`
    SELECT id, created_at, effective_directive, violated_directive,
           disposition, document_origin, user_agent
    FROM csp_reports
    ORDER BY created_at DESC
    LIMIT ${safeLimit};
  `;
  return rows as CspReportRow[];
}

/**
 * Insert a waitlist signup. On duplicate email, update nothing (idempotent).
 * Returns { isNew: boolean } so we can skip emails on re-submits.
 */
export async function upsertWaitlistSignup(params: {
  email: string;
  role: string | null;
  useCase: string | null;
  source: string;
  userAgent: string | null;
  ipHash: string | null;
  intent: string | null;
  projectName: string | null;
  integrationsInterest: string[] | null;
  txVolumeBucket: string | null;
  buildStage: string | null;
}): Promise<{ isNew: boolean }> {
  const sql = getSQL();
  const emailLower = params.email.toLowerCase();

  /*
   * Design-partner re-submissions update the existing row so operators
   * always see the latest project details. Standard waitlist still uses
   * DO NOTHING to keep things lightweight.
   *
   * We use xmax = 0 to distinguish a true INSERT (isNew) from an
   * ON CONFLICT UPDATE (xmax != 0).
   */
  if (params.intent === "design_partner") {
    const rows = await sql`
      INSERT INTO waitlist_signups (
        email, role, use_case, source, user_agent, ip_hash,
        intent, project_name, integrations_interest, tx_volume_bucket, build_stage,
        updated_at
      )
      VALUES (
        ${emailLower},
        ${params.role},
        ${params.useCase},
        ${params.source},
        ${params.userAgent},
        ${params.ipHash},
        ${params.intent},
        ${params.projectName},
        ${params.integrationsInterest},
        ${params.txVolumeBucket},
        ${params.buildStage},
        now()
      )
      ON CONFLICT (email) DO UPDATE SET
        project_name           = EXCLUDED.project_name,
        integrations_interest  = EXCLUDED.integrations_interest,
        tx_volume_bucket       = EXCLUDED.tx_volume_bucket,
        build_stage            = EXCLUDED.build_stage,
        role                   = EXCLUDED.role,
        use_case               = EXCLUDED.use_case,
        intent                 = EXCLUDED.intent,
        updated_at             = now()
      WHERE waitlist_signups.intent = 'design_partner'
         OR waitlist_signups.intent IS NULL
      RETURNING id, (xmax = 0) AS inserted;
    `;
    /* inserted = true  => brand-new row
       inserted = false => existing row updated */
    const isNew = rows.length > 0 && rows[0].inserted === true;
    return { isNew };
  }

  /* Standard waitlist: ignore duplicates */
  const rows = await sql`
    INSERT INTO waitlist_signups (
      email, role, use_case, source, user_agent, ip_hash,
      intent, project_name, integrations_interest, tx_volume_bucket, build_stage,
      updated_at
    )
    VALUES (
      ${emailLower},
      ${params.role},
      ${params.useCase},
      ${params.source},
      ${params.userAgent},
      ${params.ipHash},
      ${params.intent},
      ${params.projectName},
      ${params.integrationsInterest},
      ${params.txVolumeBucket},
      ${params.buildStage},
      now()
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id;
  `;

  return { isNew: rows.length > 0 };
}

/* ---------- read helpers (admin dashboard) ---------- */

export type WaitlistSignupRow = {
  created_at: string;
  updated_at: string;
  email: string;
  intent: string | null;
  role: string | null;
  project_name: string | null;
  integrations_interest: string[] | null;
  tx_volume_bucket: string | null;
  build_stage: string | null;
  use_case: string | null;
  source: string | null;
  status: string;
  admin_notes: string | null;
};

/** Allowed pipeline status values */
export const PIPELINE_STATUSES = ["new", "contacted", "qualified", "closed"] as const;
export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

/**
 * Return recent waitlist signups ordered by newest first.
 * Optionally filter by intent.
 */
export async function listRecentWaitlistSignups({
  limit = 50,
  intent = "all",
}: {
  limit?: number;
  intent?: "standard" | "design_partner" | "all";
} = {}): Promise<WaitlistSignupRow[]> {
  await ensureWaitlistTable();
  const sql = getSQL();

  // Cap limit to a sane ceiling
  const safeLimit = Math.min(Math.max(1, limit), 500);

  if (intent === "all" || !intent) {
    const rows = await sql`
      SELECT created_at, updated_at, email, intent, role, project_name,
             integrations_interest, tx_volume_bucket, build_stage,
             use_case, source, status, admin_notes
      FROM waitlist_signups
      ORDER BY created_at DESC
      LIMIT ${safeLimit};
    `;
    return rows as WaitlistSignupRow[];
  }

  const rows = await sql`
    SELECT created_at, updated_at, email, intent, role, project_name,
           integrations_interest, tx_volume_bucket, build_stage,
           use_case, source, status, admin_notes
    FROM waitlist_signups
    WHERE intent = ${intent}
    ORDER BY created_at DESC
    LIMIT ${safeLimit};
  `;
  return rows as WaitlistSignupRow[];
}

/**
 * Update the pipeline status of a waitlist signup by email.
 * Returns the number of rows updated (0 or 1).
 */
export async function updateWaitlistSignupStatus({
  email,
  status,
}: {
  email: string;
  status: PipelineStatus;
}): Promise<number> {
  await ensureWaitlistTable();
  const sql = getSQL();
  const rows = await sql`
    UPDATE waitlist_signups
    SET status = ${status}, updated_at = now()
    WHERE email = ${email}
    RETURNING email;
  `;
  return rows.length;
}

/**
 * List all design_partner signups for CSV export.
 */
export async function listDesignPartnerSignups(
  limit = 1000,
): Promise<WaitlistSignupRow[]> {
  await ensureWaitlistTable();
  const sql = getSQL();
  const safeLimit = Math.min(Math.max(1, limit), 1000);
  const rows = await sql`
    SELECT created_at, updated_at, email, intent, role, project_name,
           integrations_interest, tx_volume_bucket, build_stage,
           use_case, source, status, admin_notes
    FROM waitlist_signups
    WHERE intent = 'design_partner'
    ORDER BY created_at DESC
    LIMIT ${safeLimit};
  `;
  return rows as WaitlistSignupRow[];
}

/**
 * Update admin_notes for a signup by email.
 * Returns the number of rows updated (0 or 1).
 */
export async function updateWaitlistAdminNotes({
  email,
  notes,
}: {
  email: string;
  notes: string;
}): Promise<number> {
  await ensureWaitlistTable();
  const sql = getSQL();
  const rows = await sql`
    UPDATE waitlist_signups
    SET admin_notes = ${notes}, updated_at = now()
    WHERE email = ${email}
    RETURNING email;
  `;
  return rows.length;
}
