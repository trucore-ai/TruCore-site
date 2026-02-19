import { neon } from "@neondatabase/serverless";

/**
 * Get a SQL query function backed by the Neon serverless driver.
 * Reads POSTGRES_URL (or DATABASE_URL) from env at call-time.
 */
function getSQL() {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("POSTGRES_URL (or DATABASE_URL) is not configured");
  }
  return neon(url);
}

/**
 * Ensure the waitlist_signups table exists.
 * Safe to call on every request — uses IF NOT EXISTS.
 */
export async function ensureWaitlistTable() {
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
}): Promise<{ isNew: boolean }> {
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO waitlist_signups (email, role, use_case, source, user_agent, ip_hash)
    VALUES (
      ${params.email.toLowerCase()},
      ${params.role},
      ${params.useCase},
      ${params.source},
      ${params.userAgent},
      ${params.ipHash}
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id;
  `;

  return { isNew: rows.length > 0 };
}
