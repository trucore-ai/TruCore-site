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
      ip_hash       TEXT,
      utm_source    TEXT,
      utm_medium    TEXT,
      utm_campaign  TEXT,
      utm_term      TEXT,
      utm_content   TEXT
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
  await sql`ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS utm_source TEXT;`;
  await sql`ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS utm_medium TEXT;`;
  await sql`ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS utm_campaign TEXT;`;
  await sql`ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS utm_term TEXT;`;
  await sql`ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS utm_content TEXT;`;
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

/* ---------- API keys + usage tables (Stage 55) ---------- */

let apiKeyTablesEnsured = false;
let partnerPortalTablesEnsured = false;

/**
 * Ensure API key and usage tables exist.
 * Safe to call on every request; uses IF NOT EXISTS and
 * skips DDL after the first successful run per process.
 */
export async function ensureApiKeyTables() {
  if (apiKeyTablesEnsured) return;

  const sql = getSQL();

  await sql`
    CREATE TABLE IF NOT EXISTS api_keys (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT NOT NULL,
      key_hash    TEXT NOT NULL UNIQUE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
      revoked_at  TIMESTAMPTZ NULL
    );
  `;

  await sql`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS owner_email TEXT;`;
  await sql`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS owner_project TEXT;`;
  await sql`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS label TEXT;`;
  await sql`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_last4 TEXT;`;
  await sql`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;`;

  await sql`
    CREATE TABLE IF NOT EXISTS api_usage (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      api_key_id  UUID NULL REFERENCES api_keys(id) ON DELETE SET NULL,
      endpoint    TEXT NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_usage_api_key_id ON api_usage(api_key_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_api_keys_owner_email ON api_keys(owner_email);`;

  apiKeyTablesEnsured = true;
}

/**
 * Ensure partner portal token table exists.
 * Safe to call on every request; uses IF NOT EXISTS and
 * skips DDL after the first successful run per process.
 */
export async function ensurePartnerPortalTables() {
  if (partnerPortalTablesEnsured) return;

  await ensureApiKeyTables();
  const sql = getSQL();

  await sql`
    CREATE TABLE IF NOT EXISTS partner_portal_tokens (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      revoked_at    TIMESTAMPTZ NULL,
      owner_email   TEXT NOT NULL,
      owner_project TEXT NULL,
      token_hash    TEXT NOT NULL UNIQUE,
      expires_at    TIMESTAMPTZ NOT NULL
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_partner_portal_tokens_owner_email ON partner_portal_tokens(owner_email);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_partner_portal_tokens_expires_at ON partner_portal_tokens(expires_at DESC);`;

  partnerPortalTablesEnsured = true;
}

export interface PartnerPortalTokenRow {
  id: string;
  created_at: string;
  revoked_at: string | null;
  owner_email: string;
  owner_project: string | null;
  token_hash: string;
  expires_at: string;
}

export interface PartnerPortalSessionOwner {
  token_id: string;
  owner_email: string;
  owner_project: string | null;
  expires_at: string;
}

export interface PartnerKeyUsageRow {
  id: string;
  label: string | null;
  created_at: string;
  revoked_at: string | null;
  key_last4: string | null;
  last_seen_at: string | null;
  total_requests: number;
  last_24h: number;
  last_7d: number;
}

export async function createPartnerPortalToken({
  ownerEmail,
  ownerProject,
  tokenHash,
  expiresAt,
}: {
  ownerEmail: string;
  ownerProject?: string | null;
  tokenHash: string;
  expiresAt: Date;
}): Promise<PartnerPortalTokenRow> {
  await ensurePartnerPortalTables();
  const sql = getSQL();

  const rows = await sql`
    INSERT INTO partner_portal_tokens (owner_email, owner_project, token_hash, expires_at)
    VALUES (${ownerEmail.toLowerCase()}, ${ownerProject ?? null}, ${tokenHash}, ${expiresAt.toISOString()})
    RETURNING id, created_at, revoked_at, owner_email, owner_project, token_hash, expires_at;
  `;

  return rows[0] as PartnerPortalTokenRow;
}

export async function revokePartnerPortalToken(id: string): Promise<boolean> {
  await ensurePartnerPortalTables();
  const sql = getSQL();

  const rows = await sql`
    UPDATE partner_portal_tokens
    SET revoked_at = now()
    WHERE id = ${id}
      AND revoked_at IS NULL
    RETURNING id;
  `;

  return rows.length > 0;
}

export async function revokePartnerPortalTokensForOwner(ownerEmail: string): Promise<number> {
  await ensurePartnerPortalTables();
  const sql = getSQL();

  const rows = await sql`
    UPDATE partner_portal_tokens
    SET revoked_at = now()
    WHERE owner_email = ${ownerEmail.toLowerCase()}
      AND revoked_at IS NULL
    RETURNING id;
  `;

  return rows.length;
}

export async function getActivePartnerPortalTokenByHash(
  tokenHash: string,
): Promise<PartnerPortalTokenRow | null> {
  await ensurePartnerPortalTables();
  const sql = getSQL();

  const rows = await sql`
    SELECT id, created_at, revoked_at, owner_email, owner_project, token_hash, expires_at
    FROM partner_portal_tokens
    WHERE token_hash = ${tokenHash}
      AND revoked_at IS NULL
      AND expires_at > now()
    LIMIT 1;
  `;

  return (rows[0] ?? null) as PartnerPortalTokenRow | null;
}

export async function getPartnerFromPortalSession({
  tokenId,
  ownerEmail,
}: {
  tokenId: string;
  ownerEmail: string;
}): Promise<PartnerPortalSessionOwner | null> {
  await ensurePartnerPortalTables();
  const sql = getSQL();

  const rows = await sql`
    SELECT
      id AS token_id,
      owner_email,
      owner_project,
      expires_at
    FROM partner_portal_tokens
    WHERE id = ${tokenId}
      AND owner_email = ${ownerEmail.toLowerCase()}
      AND revoked_at IS NULL
      AND expires_at > now()
    LIMIT 1;
  `;

  return (rows[0] ?? null) as PartnerPortalSessionOwner | null;
}

export async function listPartnerPortalTokensByOwner(
  ownerEmail: string,
  limit = 20,
): Promise<PartnerPortalTokenRow[]> {
  await ensurePartnerPortalTables();
  const sql = getSQL();
  const safeLimit = Math.min(Math.max(1, limit), 100);

  const rows = await sql`
    SELECT id, created_at, revoked_at, owner_email, owner_project, token_hash, expires_at
    FROM partner_portal_tokens
    WHERE owner_email = ${ownerEmail.toLowerCase()}
    ORDER BY created_at DESC
    LIMIT ${safeLimit};
  `;

  return rows as PartnerPortalTokenRow[];
}

export async function listLatestActivePortalTokensForOwners(
  ownerEmails: string[],
): Promise<Array<Pick<PartnerPortalTokenRow, "id" | "owner_email" | "expires_at" | "created_at">>> {
  await ensurePartnerPortalTables();
  const sql = getSQL();
  const normalizedEmails = Array.from(new Set(ownerEmails.map((email) => email.trim().toLowerCase()).filter(Boolean)));

  if (normalizedEmails.length === 0) return [];

  const rows = await sql`
    SELECT DISTINCT ON (owner_email)
      id,
      owner_email,
      created_at,
      expires_at
    FROM partner_portal_tokens
    WHERE owner_email = ANY(${normalizedEmails})
      AND revoked_at IS NULL
      AND expires_at > now()
    ORDER BY owner_email ASC, created_at DESC;
  `;

  return rows as Array<Pick<PartnerPortalTokenRow, "id" | "owner_email" | "expires_at" | "created_at">>;
}

export async function listPartnerKeysAndUsage(
  ownerEmail: string,
): Promise<PartnerKeyUsageRow[]> {
  await ensureApiKeyTables();
  const sql = getSQL();

  const rows = await sql`
    SELECT
      k.id,
      k.label,
      k.created_at,
      k.revoked_at,
      k.key_last4,
      COALESCE(k.last_seen_at, MAX(u.created_at)) AS last_seen_at,
      COUNT(u.id)::int AS total_requests,
      COUNT(*) FILTER (
        WHERE u.created_at >= now() - INTERVAL '24 hours'
      )::int AS last_24h,
      COUNT(*) FILTER (
        WHERE u.created_at >= now() - INTERVAL '7 days'
      )::int AS last_7d
    FROM api_keys k
    LEFT JOIN api_usage u ON u.api_key_id = k.id
    WHERE k.owner_email = ${ownerEmail.toLowerCase()}
    GROUP BY k.id, k.label, k.created_at, k.revoked_at, k.key_last4, k.last_seen_at
    ORDER BY k.created_at DESC;
  `;

  return (rows as Array<PartnerKeyUsageRow>).map((row) => ({
    ...row,
    total_requests: Number(row.total_requests ?? 0),
    last_24h: Number(row.last_24h ?? 0),
    last_7d: Number(row.last_7d ?? 0),
  }));
}

export type UsageWindow = "24h" | "7d" | "30d" | "all";

export interface ApiKeyUsageSummaryRow {
  id: string;
  name: string;
  label: string | null;
  owner_email: string | null;
  owner_project: string | null;
  created_at: string;
  revoked_at: string | null;
  last_seen_at: string | null;
  total_requests: number;
  last_24h: number;
  last_7d: number;
  top_endpoint: string | null;
  top_endpoint_count: number;
}

export interface UsageSummaryResult {
  total_requests: number;
  last_seen_at: string | null;
  endpoint_counts: Array<{
    endpoint: string;
    request_count: number;
  }>;
}

function toUsageWindow(value: UsageWindow): UsageWindow {
  if (value === "24h" || value === "7d" || value === "30d" || value === "all") {
    return value;
  }
  return "7d";
}

export async function listApiKeysWithUsageSummary(
  limit = 100,
  {
    includeRevoked = true,
  }: {
    includeRevoked?: boolean;
  } = {},
): Promise<ApiKeyUsageSummaryRow[]> {
  await ensureApiKeyTables();
  const sql = getSQL();
  const safeLimit = Math.min(Math.max(1, limit), 500);

  const rows = await sql`
    SELECT
      k.id,
      k.name,
      k.label,
      k.owner_email,
      k.owner_project,
      k.created_at,
      k.revoked_at,
      COALESCE(k.last_seen_at, MAX(u.created_at)) AS last_seen_at,
      COUNT(u.id)::int AS total_requests,
      COUNT(*) FILTER (
        WHERE u.created_at >= now() - INTERVAL '24 hours'
      )::int AS last_24h,
      COUNT(*) FILTER (
        WHERE u.created_at >= now() - INTERVAL '7 days'
      )::int AS last_7d,
      (
        SELECT uu.endpoint
        FROM api_usage uu
        WHERE uu.api_key_id = k.id
        GROUP BY uu.endpoint
        ORDER BY COUNT(*) DESC, uu.endpoint ASC
        LIMIT 1
      ) AS top_endpoint,
      (
        SELECT COUNT(*)::int
        FROM api_usage uu
        WHERE uu.api_key_id = k.id
        AND uu.endpoint = (
          SELECT uuu.endpoint
          FROM api_usage uuu
          WHERE uuu.api_key_id = k.id
          GROUP BY uuu.endpoint
          ORDER BY COUNT(*) DESC, uuu.endpoint ASC
          LIMIT 1
        )
      ) AS top_endpoint_count
    FROM api_keys k
    LEFT JOIN api_usage u ON u.api_key_id = k.id
    WHERE (${includeRevoked} OR k.revoked_at IS NULL)
    GROUP BY
      k.id,
      k.name,
      k.label,
      k.owner_email,
      k.owner_project,
      k.created_at,
      k.revoked_at,
      k.last_seen_at
    ORDER BY k.created_at DESC
    LIMIT ${safeLimit};
  `;

  return rows.map((row) => ({
    ...(row as ApiKeyUsageSummaryRow),
    top_endpoint_count: Number((row as ApiKeyUsageSummaryRow).top_endpoint_count ?? 0),
  })) as ApiKeyUsageSummaryRow[];
}

export async function listActiveApiKeyOwnerEmails(): Promise<string[]> {
  await ensureApiKeyTables();
  const sql = getSQL();
  const rows = await sql`
    SELECT DISTINCT owner_email
    FROM api_keys
    WHERE revoked_at IS NULL
      AND owner_email IS NOT NULL
      AND TRIM(owner_email) <> '';
  `;

  return (rows as Array<{ owner_email: string }>).map((row) => row.owner_email.toLowerCase());
}

export async function getUsageSummaryForKey(
  keyId: string,
  window: UsageWindow,
): Promise<UsageSummaryResult> {
  await ensureApiKeyTables();
  const sql = getSQL();
  const safeWindow = toUsageWindow(window);

  const rows = await sql`
    SELECT
      endpoint,
      COUNT(*)::int AS request_count,
      MAX(created_at) AS last_seen_at
    FROM api_usage
    WHERE api_key_id = ${keyId}
      AND (
        ${safeWindow} = 'all'
        OR created_at >= now() - (
          CASE
            WHEN ${safeWindow} = '24h' THEN INTERVAL '24 hours'
            WHEN ${safeWindow} = '7d' THEN INTERVAL '7 days'
            ELSE INTERVAL '30 days'
          END
        )
      )
    GROUP BY endpoint
    ORDER BY request_count DESC, endpoint ASC;
  `;

  const endpointCounts = (rows as Array<{ endpoint: string; request_count: number; last_seen_at: string | null }>).map(
    (row) => ({
      endpoint: row.endpoint,
      request_count: Number(row.request_count ?? 0),
    }),
  );
  const totalRequests = endpointCounts.reduce((acc, row) => acc + row.request_count, 0);
  const lastSeen = (rows as Array<{ last_seen_at: string | null }>).reduce<string | null>((acc, row) => {
    if (!row.last_seen_at) return acc;
    if (!acc) return row.last_seen_at;
    return new Date(row.last_seen_at) > new Date(acc) ? row.last_seen_at : acc;
  }, null);

  return {
    total_requests: totalRequests,
    last_seen_at: lastSeen,
    endpoint_counts: endpointCounts,
  };
}

export async function getUsageSummaryForOwner(
  email: string,
  window: UsageWindow,
): Promise<UsageSummaryResult> {
  await ensureApiKeyTables();
  const sql = getSQL();
  const safeWindow = toUsageWindow(window);
  const ownerEmail = email.trim().toLowerCase();

  const rows = await sql`
    SELECT
      u.endpoint,
      COUNT(*)::int AS request_count,
      MAX(u.created_at) AS last_seen_at
    FROM api_usage u
    INNER JOIN api_keys k ON k.id = u.api_key_id
    WHERE k.owner_email = ${ownerEmail}
      AND (
        ${safeWindow} = 'all'
        OR u.created_at >= now() - (
          CASE
            WHEN ${safeWindow} = '24h' THEN INTERVAL '24 hours'
            WHEN ${safeWindow} = '7d' THEN INTERVAL '7 days'
            ELSE INTERVAL '30 days'
          END
        )
      )
    GROUP BY u.endpoint
    ORDER BY request_count DESC, u.endpoint ASC;
  `;

  const endpointCounts = (rows as Array<{ endpoint: string; request_count: number; last_seen_at: string | null }>).map(
    (row) => ({
      endpoint: row.endpoint,
      request_count: Number(row.request_count ?? 0),
    }),
  );
  const totalRequests = endpointCounts.reduce((acc, row) => acc + row.request_count, 0);
  const lastSeen = (rows as Array<{ last_seen_at: string | null }>).reduce<string | null>((acc, row) => {
    if (!row.last_seen_at) return acc;
    if (!acc) return row.last_seen_at;
    return new Date(row.last_seen_at) > new Date(acc) ? row.last_seen_at : acc;
  }, null);

  return {
    total_requests: totalRequests,
    last_seen_at: lastSeen,
    endpoint_counts: endpointCounts,
  };
}

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
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
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
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
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
        ${params.utmSource},
        ${params.utmMedium},
        ${params.utmCampaign},
        ${params.utmTerm},
        ${params.utmContent},
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
        utm_source             = COALESCE(waitlist_signups.utm_source, EXCLUDED.utm_source),
        utm_medium             = COALESCE(waitlist_signups.utm_medium, EXCLUDED.utm_medium),
        utm_campaign           = COALESCE(waitlist_signups.utm_campaign, EXCLUDED.utm_campaign),
        utm_term               = COALESCE(waitlist_signups.utm_term, EXCLUDED.utm_term),
        utm_content            = COALESCE(waitlist_signups.utm_content, EXCLUDED.utm_content),
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
      utm_source, utm_medium, utm_campaign, utm_term, utm_content,
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
      ${params.utmSource},
      ${params.utmMedium},
      ${params.utmCampaign},
      ${params.utmTerm},
      ${params.utmContent},
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
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
};

export type WaitlistMetricsSnapshot = {
  total_signups: number;
  design_partner_count: number;
  standard_count: number;
  by_status: {
    new: number;
    contacted: number;
    qualified: number;
    closed: number;
  };
  top_utm_sources: Array<{ source: string; count: number }>;
  top_campaigns: Array<{ campaign: string; count: number }>;
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
              use_case, source, status, admin_notes,
              utm_source, utm_medium, utm_campaign, utm_term, utm_content
      FROM waitlist_signups
      ORDER BY created_at DESC
      LIMIT ${safeLimit};
    `;
    return rows as WaitlistSignupRow[];
  }

  const rows = await sql`
    SELECT created_at, updated_at, email, intent, role, project_name,
           integrations_interest, tx_volume_bucket, build_stage,
          use_case, source, status, admin_notes,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content
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
          use_case, source, status, admin_notes,
          utm_source, utm_medium, utm_campaign, utm_term, utm_content
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

function toInt(value: unknown): number {
  return Number(value ?? 0);
}

export async function getWaitlistMetricsSnapshot(): Promise<WaitlistMetricsSnapshot> {
  await ensureWaitlistTable();
  const sql = getSQL();

  const totalsRows = await sql`
    SELECT
      COUNT(*)::int AS total_signups,
      COUNT(*) FILTER (WHERE intent = 'design_partner')::int AS design_partner_count,
      COUNT(*) FILTER (WHERE intent = 'standard' OR intent IS NULL)::int AS standard_count,
      COUNT(*) FILTER (WHERE status = 'new' OR status IS NULL)::int AS status_new,
      COUNT(*) FILTER (WHERE status = 'contacted')::int AS status_contacted,
      COUNT(*) FILTER (WHERE status = 'qualified')::int AS status_qualified,
      COUNT(*) FILTER (WHERE status = 'closed')::int AS status_closed
    FROM waitlist_signups;
  `;

  const topSourceRows = await sql`
    SELECT utm_source AS source, COUNT(*)::int AS count
    FROM waitlist_signups
    WHERE utm_source IS NOT NULL AND TRIM(utm_source) <> ''
    GROUP BY utm_source
    ORDER BY count DESC, utm_source ASC
    LIMIT 5;
  `;

  const topCampaignRows = await sql`
    SELECT utm_campaign AS campaign, COUNT(*)::int AS count
    FROM waitlist_signups
    WHERE utm_campaign IS NOT NULL AND TRIM(utm_campaign) <> ''
    GROUP BY utm_campaign
    ORDER BY count DESC, utm_campaign ASC
    LIMIT 5;
  `;

  const totals = totalsRows[0] as Record<string, unknown>;

  return {
    total_signups: toInt(totals.total_signups),
    design_partner_count: toInt(totals.design_partner_count),
    standard_count: toInt(totals.standard_count),
    by_status: {
      new: toInt(totals.status_new),
      contacted: toInt(totals.status_contacted),
      qualified: toInt(totals.status_qualified),
      closed: toInt(totals.status_closed),
    },
    top_utm_sources: (topSourceRows as Array<Record<string, unknown>>).map((row) => ({
      source: String(row.source),
      count: toInt(row.count),
    })),
    top_campaigns: (topCampaignRows as Array<Record<string, unknown>>).map((row) => ({
      campaign: String(row.campaign),
      count: toInt(row.count),
    })),
  };
}
