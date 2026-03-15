import { NextRequest, NextResponse } from "next/server";
import { assertRateLimit } from "@/lib/rate-limit";
import { revokePartnerPortalToken } from "@/lib/db";
import { logAdminAction } from "@/lib/audit-log";
import { withAdminApiAuth } from "@/lib/admin-api-auth";

function isFormRequest(request: NextRequest): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  );
}

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

export const POST = withAdminApiAuth(async (request: NextRequest) => {
  try {
    assertRateLimit("admin:portal");
  } catch {
    if (isFormRequest(request)) {
      return NextResponse.redirect(new URL("/admin/login", request.url), 303);
    }
    return NextResponse.json(
      { error: "not_found" },
      { status: 404 },
    );
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
      { status: 400 },
    );
  }

  const revoked = await revokePartnerPortalToken(id);

  if (revoked) {
    await logAdminAction({
      action: "partner_portal_token_revoke",
      metadata: { portalTokenId: id },
    });
  }

  if (isFormRequest(request)) {
    return NextResponse.redirect(getRedirectTarget(request), 303);
  }

  return NextResponse.json(
    { ok: true, revoked },
    { status: 200 },
  );
});
