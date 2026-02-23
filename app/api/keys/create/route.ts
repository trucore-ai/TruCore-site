import { NextRequest, NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/admin-auth";
import { createApiKey } from "@/lib/api-keys";
import { assertRateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/audit-log";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

function parseNameFromRequestBody(value: unknown): string {
  if (!value || typeof value !== "object") return "Partner Key";
  const raw = (value as Record<string, unknown>).name;
  if (typeof raw !== "string") return "Partner Key";
  return raw.trim().slice(0, 120) || "Partner Key";
}

export async function POST(request: NextRequest) {
  try {
    await assertAdminSession();
    assertRateLimit("admin:keys");
  } catch {
    return NextResponse.json(
      { error: "not_found" },
      {
        status: 404,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  let parsed: unknown = null;
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      parsed = await request.json();
    } else {
      const formData = await request.formData();
      parsed = { name: formData.get("name") };
    }
  } catch {
    return NextResponse.json(
      { error: "invalid_request" },
      {
        status: 400,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  const name = parseNameFromRequestBody(parsed);

  try {
    const created = await createApiKey(name);

    await logAdminAction({
      action: "api_key_create",
      metadata: {
        apiKeyId: created.record.id,
        name: created.record.name,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        key: {
          id: created.record.id,
          name: created.record.name,
          created_at: created.record.created_at,
          revoked_at: created.record.revoked_at,
        },
        raw_key: created.rawKey,
      },
      {
        status: 201,
        headers: NO_STORE_HEADERS,
      },
    );
  } catch {
    return NextResponse.json(
      { error: "key_creation_failed" },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      },
    );
  }
}
