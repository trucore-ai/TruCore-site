import { NextResponse } from "next/server";
import { ensureApiKeyTables, getSQL } from "@/lib/db";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

function roundForPublicDisplay(value: number): number {
  if (value <= 0) return 0;
  return Math.round(value / 5) * 5;
}

export async function GET() {
  try {
    await ensureApiKeyTables();
    const sql = getSQL();

    const rows = await sql`
      SELECT
        COUNT(*) FILTER (
          WHERE endpoint = '/api/simulate'
            AND created_at >= now() - INTERVAL '24 hours'
        )::int AS simulator_requests_24h,
        (
          SELECT COUNT(*)::int
          FROM api_keys
          WHERE revoked_at IS NULL
            AND owner_email IS NOT NULL
        ) AS active_partner_keys,
        COUNT(*) FILTER (
          WHERE endpoint = '/api/simulate'
        )::int AS receipts_generated_total
      FROM api_usage;
    `;

    const row = (rows[0] ?? {}) as Record<string, unknown>;
    return NextResponse.json(
      {
        simulator_requests_24h: roundForPublicDisplay(Number(row.simulator_requests_24h ?? 0)),
        active_partner_keys: Number(row.active_partner_keys ?? 0),
        receipts_generated_total: roundForPublicDisplay(Number(row.receipts_generated_total ?? 0)),
      },
      {
        headers: NO_STORE_HEADERS,
      },
    );
  } catch {
    return NextResponse.json(
      {
        simulator_requests_24h: 0,
        active_partner_keys: 0,
        receipts_generated_total: 0,
        preview_mode: true,
      },
      {
        headers: NO_STORE_HEADERS,
      },
    );
  }
}
