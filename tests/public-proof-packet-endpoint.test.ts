/**
 * Tests for GET /api/proof/packet — public read-only proof packet endpoint.
 */

import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/* ═══════════ Mocks ═══════════ */

vi.mock("@/lib/share-utils", () => ({
  buildVerifyUrl: (hash: string) =>
    `https://www.trucore.xyz/verify?hash=${encodeURIComponent(hash)}&from=share`,
  buildOgPreviewUrl: (hash: string) =>
    `https://www.trucore.xyz/api/og/receipt?hash=${encodeURIComponent(hash)}`,
  getCanonicalSiteOrigin: () => "https://www.trucore.xyz",
}));

/* ── Lazy route import (after mocks) ── */
const proofPacketRoute = () => import("@/app/api/proof/packet/route");

/* ═══════════ Helpers ═══════════ */

function makeGet(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

const VALID_HASH = "abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234";
const INVALID_HASH_TOO_SHORT = "abcd1234";
const INVALID_HASH_NON_HEX = "gggg1234gggg1234gggg1234gggg1234gggg1234gggg1234gggg1234gggg1234";

/* ═══════════ Sensitive field list ═══════════ */

const SENSITIVE_FIELDS = [
  "wallet_address",
  "private_key",
  "token",
  "secret",
  "amount",
  "policy_internals",
  "raw_policy",
  "backend_meta",
  "address",
  "api_key",
  "password",
  "credentials",
] as const;

/* ═══════════════════════════════════════════════════════════
 *  GET /api/proof/packet — missing hash
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/proof/packet — missing hash", () => {
  it("returns 400 with missing_hash error when no hash provided", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet("/api/proof/packet"));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("missing_hash");
    expect(json.error.message).toContain("required");
  });

  it("returns 400 with missing_hash error when hash is empty string", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet("/api/proof/packet?hash="));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("missing_hash");
  });
});

/* ═══════════════════════════════════════════════════════════
 *  GET /api/proof/packet — invalid hash
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/proof/packet — invalid hash", () => {
  it("returns 400 with invalid_hash error for too short hash", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${INVALID_HASH_TOO_SHORT}`));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("invalid_hash");
    expect(json.error.message).toContain("64-character hex");
  });

  it("returns 400 with invalid_hash error for non-hex characters", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${INVALID_HASH_NON_HEX}`));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("invalid_hash");
  });

  it("returns 400 for hash with special characters", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet("/api/proof/packet?hash=<script>alert(1)</script>"));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("invalid_hash");
  });

  it("returns 400 for hash longer than 64 characters", async () => {
    const { GET } = await proofPacketRoute();
    const longHash = "a".repeat(128);
    const res = await GET(makeGet(`/api/proof/packet?hash=${longHash}`));

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.status).toBe("error");
    expect(json.error.code).toBe("invalid_hash");
  });
});

/* ═══════════════════════════════════════════════════════════
 *  GET /api/proof/packet — valid hash
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/proof/packet — valid hash", () => {
  it("returns 200 with status ok for valid hash", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.data).toBeDefined();
  });

  it("returns packet with correct version", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    expect(json.data.version).toBe(1);
  });

  it("returns packet with correct type", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    expect(json.data.type).toBe("trucore_proof_packet");
  });

  it("returns packet with status success", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    expect(json.data.status).toBe("success");
  });

  it("returns packet with proof.hash matching input", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    expect(json.data.proof.hash).toBe(VALID_HASH.toLowerCase());
  });

  it("returns packet with proof.decision", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    expect(["ALLOW", "DENY", "UNKNOWN"]).toContain(json.data.proof.decision);
  });

  it("returns packet with proof.verified boolean", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    expect(typeof json.data.proof.verified).toBe("boolean");
  });

  it("normalises uppercase hash to lowercase", async () => {
    const { GET } = await proofPacketRoute();
    const uppercaseHash = VALID_HASH.toUpperCase();
    const res = await GET(makeGet(`/api/proof/packet?hash=${uppercaseHash}`));

    const json = await res.json();
    expect(json.data.proof.hash).toBe(VALID_HASH.toLowerCase());
  });
});

/* ═══════════════════════════════════════════════════════════
 *  GET /api/proof/packet — canonical URLs
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/proof/packet — canonical URLs", () => {
  it("includes links.verify_url with www.trucore.xyz", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    expect(json.data.links.verify_url).toContain("https://www.trucore.xyz/verify");
  });

  it("verify_url includes hash parameter", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    expect(json.data.links.verify_url).toContain("hash=");
  });

  it("verify_url includes from=share tracking", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    expect(json.data.links.verify_url).toContain("from=share");
  });

  it("includes links.og_preview_url with www.trucore.xyz", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    expect(json.data.links.og_preview_url).toContain("https://www.trucore.xyz/api/og/receipt");
  });

  it("og_preview_url includes hash parameter", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    expect(json.data.links.og_preview_url).toContain("hash=");
  });
});

/* ═══════════════════════════════════════════════════════════
 *  GET /api/proof/packet — meta fields
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/proof/packet — meta fields", () => {
  it("includes meta.exported_at timestamp", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    expect(json.data.meta.exported_at).toBeDefined();
    // ISO 8601 timestamp format check
    expect(json.data.meta.exported_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("includes meta.source as trucore-site", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    expect(json.data.meta.source).toBe("trucore-site");
  });
});

/* ═══════════════════════════════════════════════════════════
 *  GET /api/proof/packet — no sensitive fields
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/proof/packet — no sensitive fields", () => {
  it("does not expose any sensitive fields in response", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    const jsonString = JSON.stringify(json).toLowerCase();

    for (const field of SENSITIVE_FIELDS) {
      expect(jsonString).not.toContain(`"${field}"`);
    }
  });

  it("packet proof does not contain receipt_id (hash-centric)", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    expect(json.data.proof.receipt_id).toBeUndefined();
  });

  it("response envelope only contains status and data", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    const keys = Object.keys(json);
    expect(keys).toEqual(["status", "data"]);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  GET /api/proof/packet — cache headers
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/proof/packet — cache headers", () => {
  it("success response has public cache-control", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    expect(res.headers.get("cache-control")).toContain("public");
  });

  it("success response has max-age directive", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    expect(res.headers.get("cache-control")).toContain("max-age=");
  });

  it("error response has no-store cache-control", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet("/api/proof/packet"));

    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});

/* ═══════════════════════════════════════════════════════════
 *  GET /api/proof/packet — determinism
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/proof/packet — determinism", () => {
  it("same hash returns consistent packet structure", async () => {
    const { GET } = await proofPacketRoute();

    const res1 = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));
    const res2 = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json1 = await res1.json();
    const json2 = await res2.json();

    // Structure should be identical
    expect(json1.data.version).toBe(json2.data.version);
    expect(json1.data.type).toBe(json2.data.type);
    expect(json1.data.status).toBe(json2.data.status);
    expect(json1.data.proof.hash).toBe(json2.data.proof.hash);
    expect(json1.data.proof.decision).toBe(json2.data.proof.decision);
    expect(json1.data.proof.verified).toBe(json2.data.proof.verified);
    expect(json1.data.meta.source).toBe(json2.data.meta.source);
  });
});

/* ═══════════════════════════════════════════════════════════
 *  GET /api/proof/packet — reuses proof packet schema
 * ═══════════════════════════════════════════════════════════ */

describe("GET /api/proof/packet — packet schema compatibility", () => {
  it("response.data matches ProofPacket interface structure", async () => {
    const { GET } = await proofPacketRoute();
    const res = await GET(makeGet(`/api/proof/packet?hash=${VALID_HASH}`));

    const json = await res.json();
    const packet = json.data;

    // Required top-level fields
    expect(packet).toHaveProperty("version");
    expect(packet).toHaveProperty("type");
    expect(packet).toHaveProperty("status");
    expect(packet).toHaveProperty("proof");
    expect(packet).toHaveProperty("links");
    expect(packet).toHaveProperty("meta");

    // Required proof fields
    expect(packet.proof).toHaveProperty("hash");
    expect(packet.proof).toHaveProperty("decision");
    expect(packet.proof).toHaveProperty("verified");

    // Required links fields
    expect(packet.links).toHaveProperty("verify_url");
    expect(packet.links).toHaveProperty("og_preview_url");

    // Required meta fields
    expect(packet.meta).toHaveProperty("exported_at");
    expect(packet.meta).toHaveProperty("source");
  });
});
