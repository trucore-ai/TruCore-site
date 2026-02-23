import { ensureApiKeyTables, getSQL } from "./db";

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
  } catch (err) {
    console.error("[usage-meter] write failed:", err);
  }
}
