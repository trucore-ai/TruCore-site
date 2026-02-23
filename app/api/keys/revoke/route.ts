import { NextRequest, NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/admin-auth";
import { revokeApiKey } from "@/lib/api-keys";
import { assertRateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/audit-log";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

function getRedirectTarget(request: NextRequest): URL {
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.pathname.startsWith("/admin")) {
        return refererUrl;
      }
    } catch {
      // ignore malformed referer
    }
  }

  return new URL("/admin/keys", request.url);
}

function isFormRequest(request: NextRequest): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

function responseNotFound(request: NextRequest) {
  if (isFormRequest(request)) {
    return NextResponse.redirect(new URL("/admin/login", request.url), 303);
  }

  return NextResponse.json(
    { error: "not_found" },
    {
      status: 404,
      headers: NO_STORE_HEADERS,
    },
  );
}

export async function POST(request: NextRequest) {
  try {
    await assertAdminSession();
    assertRateLimit("admin:keys");
  } catch {
    return responseNotFound(request);
  }

  let id = "";
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      id = typeof body.id === "string" ? body.id.trim() : "";
    } else {
      const formData = await request.formData();
      const raw = formData.get("id");
      id = typeof raw === "string" ? raw.trim() : "";
    }
  } catch {
    id = "";
  }

  if (!id) {
    if (isFormRequest(request)) {
      return NextResponse.redirect(getRedirectTarget(request), 303);
    }

    return NextResponse.json(
      { error: "missing_id" },
      {
        status: 400,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  const revoked = await revokeApiKey(id);

  if (revoked) {
    await logAdminAction({
      action: "api_key_revoke",
      metadata: { apiKeyId: id },
    });
  }

  if (isFormRequest(request)) {
    return NextResponse.redirect(getRedirectTarget(request), 303);
  }

  return NextResponse.json(
    { ok: true, revoked },
    {
      status: 200,
      headers: NO_STORE_HEADERS,
    },
  );
}
