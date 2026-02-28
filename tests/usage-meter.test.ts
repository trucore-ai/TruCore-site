import { beforeEach, describe, expect, it, vi } from "vitest";

const usageRows: Array<{
  api_key_id: string | null;
  endpoint: string;
  created_at_ms: number;
}> = [];

const keyLastSeen = new Map<string, number>();
let mockNowMs = Date.parse("2026-02-23T12:00:00.000Z");

vi.mock("@/lib/db", () => {
  return {
    ensureApiKeyTables: vi.fn(async () => undefined),
    getSQL: () =>
      async (strings: TemplateStringsArray, ...values: unknown[]) => {
        const query = strings.join(" ").replace(/\s+/g, " ").trim();

        if (query.includes("INSERT INTO api_usage")) {
          usageRows.push({
            api_key_id: (values[0] as string | null | undefined) ?? null,
            endpoint: String(values[1] ?? ""),
            created_at_ms: mockNowMs,
          });
          return [];
        }

        if (query.includes("UPDATE api_keys") && query.includes("last_seen_at")) {
          const keyId = String(values[0] ?? "");
          keyLastSeen.set(keyId, mockNowMs);
          return [];
        }

        if (query.includes("SELECT") && query.includes("COUNT(*)::int AS total_requests")) {
          const keyId = (values[0] as string | null | undefined) ?? null;
          const filtered = keyId
            ? usageRows.filter((row) => row.api_key_id === keyId)
            : [...usageRows];

          const day24 = 24 * 60 * 60 * 1000;
          const day7 = 7 * day24;
          const day30 = 30 * day24;

          const total = filtered.length;
          const last24h = filtered.filter((row) => mockNowMs - row.created_at_ms <= day24).length;
          const last7d = filtered.filter((row) => mockNowMs - row.created_at_ms <= day7).length;
          const last30d = filtered.filter((row) => mockNowMs - row.created_at_ms <= day30).length;

          return [
            {
              total_requests: total,
              last_24h: last24h,
              last_7d: last7d,
              last_30d: last30d,
            },
          ];
        }

        return [];
      },
  };
});

import { getUsageRollup, recordUsage } from "@/lib/usage-meter";

describe("usage meter", () => {
  beforeEach(() => {
    usageRows.splice(0, usageRows.length);
    keyLastSeen.clear();
    mockNowMs = Date.parse("2026-02-23T12:00:00.000Z");
  });

  it("records api_key_id when provided", async () => {
    await recordUsage({ apiKeyId: "key-abc", endpoint: "/api/simulate" });

    expect(usageRows).toHaveLength(1);
    expect(usageRows[0].api_key_id).toBe("key-abc");
    expect(usageRows[0].endpoint).toBe("/api/simulate");
    expect(keyLastSeen.has("key-abc")).toBe(true);
  });

  it("returns correct windowed usage aggregates", async () => {
    usageRows.push(
      {
        api_key_id: "key-1",
        endpoint: "/api/simulate",
        created_at_ms: mockNowMs - 2 * 60 * 60 * 1000,
      },
      {
        api_key_id: "key-1",
        endpoint: "/api/simulate",
        created_at_ms: mockNowMs - 2 * 24 * 60 * 60 * 1000,
      },
      {
        api_key_id: "key-1",
        endpoint: "/api/simulate",
        created_at_ms: mockNowMs - 8 * 24 * 60 * 60 * 1000,
      },
      {
        api_key_id: "key-1",
        endpoint: "/api/simulate",
        created_at_ms: mockNowMs - 31 * 24 * 60 * 60 * 1000,
      },
    );

    const rollup = await getUsageRollup({ apiKeyId: "key-1" });

    expect(rollup.total_requests).toBe(4);
    expect(rollup.last_24h).toBe(1);
    expect(rollup.last_7d).toBe(2);
    expect(rollup.last_30d).toBe(3);
  });
});
