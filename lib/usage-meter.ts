import { ensureApiKeyTables, getSQL } from "./db";

export interface UsageRollup {
  total_requests: number;
  last_24h: number;
  last_7d: number;
  last_30d: number;
}

export async function recordUsage({
  apiKeyId,
  endpoint,
}: {
  apiKeyId?: string | null;
  endpoint: string;
}): Promise<void> {
  try {
    await ensureApiKeyTables();
    const sql = getSQL();
    await sql`
      INSERT INTO api_usage (api_key_id, endpoint)
      VALUES (${apiKeyId ?? null}, ${endpoint});
    `;

    if (apiKeyId) {
      await sql`
        UPDATE api_keys
        SET last_seen_at = now()
        WHERE id = ${apiKeyId};
      `;
    }
  } catch (err) {
    console.error("[usage-meter] write failed:", err);
  }
}

export async function getUsageRollup({
  apiKeyId,
}: {
  apiKeyId?: string | null;
} = {}): Promise<UsageRollup> {
  await ensureApiKeyTables();
  const sql = getSQL();

  const rows = await sql`
    SELECT
      COUNT(*)::int AS total_requests,
      COUNT(*) FILTER (
        WHERE created_at >= now() - INTERVAL '24 hours'
      )::int AS last_24h,
      COUNT(*) FILTER (
        WHERE created_at >= now() - INTERVAL '7 days'
      )::int AS last_7d,
      COUNT(*) FILTER (
        WHERE created_at >= now() - INTERVAL '30 days'
      )::int AS last_30d
    FROM api_usage
    WHERE (${apiKeyId ?? null} IS NULL OR api_key_id = ${apiKeyId ?? null});
  `;

  const row = (rows[0] ?? {}) as Record<string, unknown>;
  return {
    total_requests: Number(row.total_requests ?? 0),
    last_24h: Number(row.last_24h ?? 0),
    last_7d: Number(row.last_7d ?? 0),
    last_30d: Number(row.last_30d ?? 0),
  };
}
