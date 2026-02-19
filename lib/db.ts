import { neon } from "@neondatabase/serverless";

/**
 * Get a SQL query function backed by the Neon serverless driver.
 * Reads POSTGRES_URL (or DATABASE_URL) from env at call-time.
 */
function getSQL() {
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

  tableEnsured = true;
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
  const rows = await sql`
    INSERT INTO waitlist_signups (
      email, role, use_case, source, user_agent, ip_hash,
      intent, project_name, integrations_interest, tx_volume_bucket, build_stage
    )
    VALUES (
      ${params.email.toLowerCase()},
      ${params.role},
      ${params.useCase},
      ${params.source},
      ${params.userAgent},
      ${params.ipHash},
      ${params.intent},
      ${params.projectName},
      ${params.integrationsInterest},
      ${params.txVolumeBucket},
      ${params.buildStage}
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id;
  `;

  return { isNew: rows.length > 0 };
}
