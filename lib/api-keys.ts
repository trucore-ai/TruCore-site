import { randomBytes } from "node:crypto";
import { ensureApiKeyTables, getSQL } from "./db";
import { sha256 } from "./hash";

export const PUBLIC_SIM_RATE_LIMIT_MAX = 30;
export const KEYED_SIM_RATE_LIMIT_MAX = 120;

export interface ApiKeyRecord {
  id: string;
  name: string;
  key_hash: string;
  key_last4: string | null;
  owner_email: string | null;
  owner_project: string | null;
  label: string | null;
  last_seen_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export function generateApiKey(): string {
  return `tk_live_${randomBytes(24).toString("hex")}`;
}

export function hashKey(raw: string): string {
  return sha256(raw);
}

export async function validateApiKey(raw: string): Promise<ApiKeyRecord | null> {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  await ensureApiKeyTables();
  const sql = getSQL();
  const keyHash = hashKey(trimmed);

  const rows = await sql`
    SELECT id, name, key_hash, key_last4, owner_email, owner_project, label, last_seen_at, created_at, revoked_at
    FROM api_keys
    WHERE key_hash = ${keyHash}
    LIMIT 1;
  `;

  const row = (rows[0] ?? null) as ApiKeyRecord | null;
  if (!row) return null;
  if (row.revoked_at) return null;
  return row;
}

export async function createApiKey(name: string): Promise<{
  rawKey: string;
  record: ApiKeyRecord;
}> {
  await ensureApiKeyTables();
  const sql = getSQL();

  const safeName = name.trim().slice(0, 120) || "Partner Key";
  const rawKey = generateApiKey();
  const keyHash = hashKey(rawKey);
  const keyLast4 = rawKey.slice(-4);

  const rows = await sql`
    INSERT INTO api_keys (name, key_hash, key_last4, label)
    VALUES (${safeName}, ${keyHash}, ${keyLast4}, ${safeName})
    RETURNING id, name, key_hash, key_last4, owner_email, owner_project, label, last_seen_at, created_at, revoked_at;
  `;

  return {
    rawKey,
    record: rows[0] as ApiKeyRecord,
  };
}

export async function createKeyForOwner({
  owner_email,
  owner_project,
  label,
}: {
  owner_email: string;
  owner_project?: string | null;
  label?: string | null;
}): Promise<{
  rawKey: string;
  record: ApiKeyRecord;
}> {
  await ensureApiKeyTables();
  const sql = getSQL();

  const normalizedEmail = owner_email.trim().toLowerCase();
  const safeProject = owner_project?.trim().slice(0, 160) || null;
  const safeLabel = label?.trim().slice(0, 120)
    || (safeProject ? `Sandbox - ${safeProject}` : `Sandbox - ${normalizedEmail}`);
  const rawKey = generateApiKey();
  const keyHash = hashKey(rawKey);
  const keyLast4 = rawKey.slice(-4);

  const rows = await sql`
    INSERT INTO api_keys (name, key_hash, key_last4, owner_email, owner_project, label)
    VALUES (${safeLabel}, ${keyHash}, ${keyLast4}, ${normalizedEmail}, ${safeProject}, ${safeLabel})
    RETURNING id, name, key_hash, key_last4, owner_email, owner_project, label, last_seen_at, created_at, revoked_at;
  `;

  return {
    rawKey,
    record: rows[0] as ApiKeyRecord,
  };
}

export async function revokeApiKey(id: string): Promise<boolean> {
  await ensureApiKeyTables();
  const sql = getSQL();

  const rows = await sql`
    UPDATE api_keys
    SET revoked_at = now()
    WHERE id = ${id} AND revoked_at IS NULL
    RETURNING id;
  `;

  return rows.length > 0;
}

export async function listApiKeys(
  limit = 100,
  {
    includeRevoked = true,
  }: {
    includeRevoked?: boolean;
  } = {},
): Promise<ApiKeyRecord[]> {
  await ensureApiKeyTables();
  const sql = getSQL();
  const safeLimit = Math.min(Math.max(1, limit), 500);

  const rows = await sql`
    SELECT id, name, key_hash, key_last4, owner_email, owner_project, label, last_seen_at, created_at, revoked_at
    FROM api_keys
    WHERE (${includeRevoked} OR revoked_at IS NULL)
    ORDER BY created_at DESC
    LIMIT ${safeLimit};
  `;

  return rows as ApiKeyRecord[];
}
