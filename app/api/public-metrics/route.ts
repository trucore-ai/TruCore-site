import { NextRequest, NextResponse } from "next/server";
import { ensureApiKeyTables, getSQL } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sha256 } from "@/lib/hash";
import { logSecurityEvent } from "@/lib/security-log";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 60_000;
const CACHE_TTL_MS = 60_000;

function roundForPublicDisplay(value: number): number {
  if (value <= 0) return 0;
  return Math.round(value / 5) * 5;
}

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "unknown";
}

/* ── In-memory response cache (process-local, short-TTL) ── */
let cachedResponse: { data: Record<string, unknown>; expiresAt: number } | null = null;

async function fetchMetrics(): Promise<Record<string, unknown>> {
  const now = Date.now();
  if (cachedResponse && now < cachedResponse.expiresAt) {
    return cachedResponse.data;
  }

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
    const data = {
      simulator_requests_24h: roundForPublicDisplay(Number(row.simulator_requests_24h ?? 0)),
      active_partner_keys: Number(row.active_partner_keys ?? 0),
      receipts_generated_total: roundForPublicDisplay(Number(row.receipts_generated_total ?? 0)),
    };

    cachedResponse = { data, expiresAt: now + CACHE_TTL_MS };
    return data;
  } catch {
    return {
      simulator_requests_24h: 0,
      active_partner_keys: 0,
      receipts_generated_total: 0,
      preview_mode: true,
    };
  }
}

export async function GET(request: NextRequest) {
  const ip = getRequestIp(request);
  const rl = consumeRateLimit(`public-metrics:${sha256(ip)}`, {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  });

  if (rl.exceeded) {
    logSecurityEvent("public_route_rate_limited", {
      ip,
      meta: { route: "public-metrics" },
    });
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          "Retry-After": String(Math.max(1, rl.resetEpochSeconds - Math.floor(Date.now() / 1000))),
        },
      },
    );
  }

  try {
    const data = await fetchMetrics();

    return NextResponse.json({ ok: true, ...data }, {
      headers: NO_STORE_HEADERS,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "temporarily_unavailable" },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }
}
