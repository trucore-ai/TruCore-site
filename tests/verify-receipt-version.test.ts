import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/verify-receipt/route";
import { demoReceipts } from "@/lib/demo-receipts";
import { isSupportedReceiptVersion } from "@/lib/receipt-verification";

describe("verify receipt version awareness", () => {
  it("treats missing version as supported in helper", () => {
    expect(isSupportedReceiptVersion(undefined)).toBe(true);
    expect(isSupportedReceiptVersion(null)).toBe(true);
  });

  it("recognizes supported and unsupported versions in helper", () => {
    expect(isSupportedReceiptVersion("v1")).toBe(true);
    expect(isSupportedReceiptVersion("999")).toBe(false);
  });

  it("treats missing version as supported", async () => {
    const demoReceipt = demoReceipts[0];

    const request = new NextRequest("http://localhost/api/verify-receipt", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        receipt_hash: demoReceipt.result.receipt_hash,
        receipt: {
          id: demoReceipt.id,
          input: demoReceipt.input,
          result: demoReceipt.result,
          created_at: demoReceipt.created_at,
        },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      ok: true;
      supported_version: boolean;
      matches: boolean;
    };

    expect(payload.ok).toBe(true);
    expect(payload.supported_version).toBe(true);
    expect(payload.matches).toBe(true);
  });

  it("accepts supported explicit version", async () => {
    const demoReceipt = demoReceipts[0];

    const request = new NextRequest("http://localhost/api/verify-receipt", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        receipt_hash: demoReceipt.result.receipt_hash,
        receipt: {
          id: demoReceipt.id,
          version: "v1",
          input: demoReceipt.input,
          result: demoReceipt.result,
          created_at: demoReceipt.created_at,
        },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      ok: true;
      supported_version: boolean;
      version: string | null;
      matches: boolean;
    };

    expect(payload.ok).toBe(true);
    expect(payload.supported_version).toBe(true);
    expect(payload.version).toBe("v1");
    expect(payload.matches).toBe(true);
  });

  it("returns unsupported_version and skips recompute for unknown version", async () => {
    const request = new NextRequest("http://localhost/api/verify-receipt", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        receipt_hash: "a".repeat(64),
        receipt: {
          version: "999",
          note: "unsupported-schema-payload",
        },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      ok: true;
      format_valid: boolean;
      supported_version: boolean;
      version: string;
      recomputed_hash?: string;
    };

    expect(payload.ok).toBe(true);
    expect(payload.format_valid).toBe(true);
    expect(payload.supported_version).toBe(false);
    expect(payload.version).toBe("999");
    expect(payload.recomputed_hash).toBeUndefined();
  });
});
