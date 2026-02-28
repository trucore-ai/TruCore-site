import { NextRequest, NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/admin-auth";
import { createKeyForOwner } from "@/lib/api-keys";
import { assertRateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/audit-log";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

type IssueRequestBody = {
  email?: unknown;
  project_name?: unknown;
  label?: unknown;
};

function parseBody(payload: unknown): {
  email: string;
  projectName: string | null;
  label: string | null;
} | null {
  if (!payload || typeof payload !== "object") return null;

  const body = payload as IssueRequestBody;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) return null;

  const projectName = typeof body.project_name === "string"
    ? body.project_name.trim().slice(0, 160)
    : "";
  const label = typeof body.label === "string"
    ? body.label.trim().slice(0, 120)
    : "";

  return {
    email,
    projectName: projectName || null,
    label: label || null,
  };
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

  let parsedPayload: unknown;
  try {
    parsedPayload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request" },
      {
        status: 400,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  const parsedBody = parseBody(parsedPayload);
  if (!parsedBody) {
    return NextResponse.json(
      { error: "invalid_request" },
      {
        status: 400,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  try {
    const issued = await createKeyForOwner({
      owner_email: parsedBody.email,
      owner_project: parsedBody.projectName,
      label: parsedBody.label,
    });

    await logAdminAction({
      action: "api_key_issue_partner",
      targetEmail: parsedBody.email,
      metadata: {
        apiKeyId: issued.record.id,
        owner_email: issued.record.owner_email,
        owner_project: issued.record.owner_project,
        label: issued.record.label,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        key: {
          id: issued.record.id,
          label: issued.record.label,
          owner_email: issued.record.owner_email,
          owner_project: issued.record.owner_project,
          created_at: issued.record.created_at,
          revoked_at: issued.record.revoked_at,
        },
        raw_key: issued.rawKey,
      },
      {
        status: 201,
        headers: NO_STORE_HEADERS,
      },
    );
  } catch {
    return NextResponse.json(
      { error: "key_issue_failed" },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      },
    );
  }
}
