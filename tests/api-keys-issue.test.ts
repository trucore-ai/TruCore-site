import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const insertedKeyRows: Array<{
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
}> = [];

vi.mock("@/lib/db", () => {
  return {
    ensureApiKeyTables: vi.fn(async () => undefined),
    getSQL: () =>
      async (strings: TemplateStringsArray, ...values: unknown[]) => {
        const query = strings.join(" ").replace(/\s+/g, " ").trim();

        if (query.includes("INSERT INTO api_keys")) {
          const now = new Date().toISOString();
          const row = {
            id: `key-${insertedKeyRows.length + 1}`,
            name: String(values[0] ?? ""),
            key_hash: String(values[1] ?? ""),
            key_last4: (values[2] as string | null | undefined) ?? null,
            owner_email: (values[3] as string | null | undefined) ?? null,
            owner_project: (values[4] as string | null | undefined) ?? null,
            label: (values[5] as string | null | undefined) ?? null,
            last_seen_at: null,
            created_at: now,
            revoked_at: null,
          };
          insertedKeyRows.push(row);
          return [row];
        }

        if (query.includes("SELECT id, name, key_hash")) {
          const keyHash = String(values[0] ?? "");
          return insertedKeyRows.filter((row) => row.key_hash === keyHash);
        }

        return [];
      },
  };
});

vi.mock("@/lib/admin-auth", () => ({
  assertAdminSession: vi.fn(async () => undefined),
}));

vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: vi.fn(() => undefined),
}));

vi.mock("@/lib/audit-log", () => ({
  logAdminAction: vi.fn(async () => undefined),
}));

import { createKeyForOwner, hashKey, validateApiKey } from "@/lib/api-keys";
import { POST } from "@/app/api/keys/issue-for-partner/route";

describe("partner key issuance", () => {
  beforeEach(() => {
    insertedKeyRows.splice(0, insertedKeyRows.length);
  });

  it("stores only key hash and owner metadata", async () => {
    const created = await createKeyForOwner({
      owner_email: "partner@example.com",
      owner_project: "Alpha Bot",
      label: "Sandbox - Alpha Bot",
    });

    expect(created.rawKey).toMatch(/^tk_live_[a-f0-9]{48}$/);
    expect(created.record.owner_email).toBe("partner@example.com");
    expect(created.record.owner_project).toBe("Alpha Bot");
    expect(insertedKeyRows).toHaveLength(1);
    expect(insertedKeyRows[0].key_hash).toBe(hashKey(created.rawKey));
    expect(JSON.stringify(insertedKeyRows[0])).not.toContain(created.rawKey);
  });

  it("issue-for-partner route returns raw key and owner info", async () => {
    const request = new NextRequest("http://localhost/api/keys/issue-for-partner", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "qualified@example.com",
        project_name: "Design Partner Project",
        label: "Sandbox - Design Partner Project",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const data = (await response.json()) as {
      ok: boolean;
      raw_key: string;
      key: {
        owner_email: string | null;
        owner_project: string | null;
      };
    };

    expect(data.ok).toBe(true);
    expect(data.raw_key).toMatch(/^tk_live_[a-f0-9]{48}$/);
    expect(data.key.owner_email).toBe("qualified@example.com");
    expect(data.key.owner_project).toBe("Design Partner Project");
  });

  it("rejects revoked keys during validation", async () => {
    const created = await createKeyForOwner({
      owner_email: "revoked@example.com",
      owner_project: "Revoked Project",
      label: "Sandbox - Revoked",
    });

    insertedKeyRows[0].revoked_at = new Date().toISOString();

    const record = await validateApiKey(created.rawKey);
    expect(record).toBeNull();
  });
});
