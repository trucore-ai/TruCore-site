import { NextRequest, NextResponse } from "next/server";
import { createApiKey } from "@/lib/api-keys";
import { assertRateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/audit-log";
import { withAdminApiAuth } from "@/lib/admin-api-auth";

function parseNameFromRequestBody(value: unknown): string {
  if (!value || typeof value !== "object") return "Partner Key";
  const raw = (value as Record<string, unknown>).name;
  if (typeof raw !== "string") return "Partner Key";
  return raw.trim().slice(0, 120) || "Partner Key";
}

export const POST = withAdminApiAuth(async (request: NextRequest) => {
  try {
    assertRateLimit("admin:keys");
  } catch {
    return NextResponse.json(
      { error: "not_found" },
      { status: 404 },
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
      { status: 400 },
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
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "key_creation_failed" },
      { status: 500 },
    );
  }
});
