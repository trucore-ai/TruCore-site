/**
 * Waitlist persistence abstraction.
 *
 * Routes submissions to the appropriate backend:
 *   1. Postgres (production) — when POSTGRES_URL / DATABASE_URL is configured
 *   2. In-memory (test/dev) — when WAITLIST_FALLBACK_MODE=memory AND
 *      no database is configured
 *
 * Fallback rules (fail-closed):
 *   - If DB is configured → always use DB, regardless of fallback flag.
 *   - If DB is NOT configured AND WAITLIST_FALLBACK_MODE=memory → use memory.
 *   - If DB is NOT configured AND flag is absent → delegate to DB
 *     (which throws; the caller's catch block produces a safe user error).
 *   - Production deploys should never set WAITLIST_FALLBACK_MODE. Even if
 *     accidentally set, DB is always preferred when configured.
 */

import { hasDatabaseConfig } from "./waitlist-config";

/* ---------- types ---------- */

export type UpsertParams = {
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
};

/* ---------- in-memory store ---------- */

const memoryEntries = new Map<string, UpsertParams>();

/* ---------- routing logic ---------- */

function isMemoryFallbackAllowed(): boolean {
  return process.env.WAITLIST_FALLBACK_MODE === "memory";
}

function shouldUseMemoryFallback(): boolean {
  if (hasDatabaseConfig()) return false;
  return isMemoryFallbackAllowed();
}

/* ---------- public API (same shape as lib/db exports) ---------- */

export async function ensureWaitlistTable(): Promise<void> {
  if (shouldUseMemoryFallback()) return;
  const { ensureWaitlistTable: dbEnsure } = await import("./db");
  return dbEnsure();
}

export async function upsertWaitlistSignup(
  params: UpsertParams,
): Promise<{ isNew: boolean }> {
  if (shouldUseMemoryFallback()) {
    const existing = memoryEntries.has(params.email);
    memoryEntries.set(params.email, { ...params });
    return { isNew: !existing };
  }
  const { upsertWaitlistSignup: dbUpsert } = await import("./db");
  return dbUpsert(params);
}

/* ---------- test-only helpers ---------- */

/**
 * Reset the in-memory waitlist store. Gated to non-production.
 * @throws in production to prevent accidental misuse.
 */
export function __resetMemoryStoreForTesting(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Memory store reset is not available in production.");
  }
  memoryEntries.clear();
}

/**
 * Return a read-only snapshot of the in-memory entries.
 * @throws in production.
 */
export function __getMemoryEntriesForTesting(): ReadonlyMap<string, UpsertParams> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Memory store inspection is not available in production.");
  }
  return memoryEntries;
}
