import { NextRequest, NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/admin-auth";
import { assertRateLimit } from "@/lib/rate-limit";
import { logAdminAction } from "@/lib/audit-log";
import {
  PARTNER_PORTAL_TOKEN_TTL_SECONDS_DEFAULT,
  createPartnerPortalAccess,
} from "@/lib/partner-portal";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

type CreateTokenBody = {
  owner_email?: unknown;
  owner_project?: unknown;
  ttl_seconds?: unknown;
};

function parseCreateBody(payload: unknown): {
  ownerEmail: string;
  ownerProject: string | null;
  ttlSeconds: number;
} | null {
  if (!payload || typeof payload !== "object") return null;

  const body = payload as CreateTokenBody;
  const ownerEmail = typeof body.owner_email === "string"
    ? body.owner_email.trim().toLowerCase()
    : "";
  if (!ownerEmail || !ownerEmail.includes("@")) return null;

  const ownerProject = typeof body.owner_project === "string"
    ? body.owner_project.trim().slice(0, 160)
    : "";

  const ttlSecondsRaw = Number(body.ttl_seconds ?? PARTNER_PORTAL_TOKEN_TTL_SECONDS_DEFAULT);
  const ttlSeconds = Number.isFinite(ttlSecondsRaw)
    ? Math.min(Math.max(Math.floor(ttlSecondsRaw), 60), PARTNER_PORTAL_TOKEN_TTL_SECONDS_DEFAULT)
    : PARTNER_PORTAL_TOKEN_TTL_SECONDS_DEFAULT;

  return {
    ownerEmail,
    ownerProject: ownerProject || null,
    ttlSeconds,
  };
}

export async function POST(request: NextRequest) {
  try {
    await assertAdminSession();
    assertRateLimit("admin:portal");
  } catch {
    return NextResponse.json(
      { error: "not_found" },
      {
        status: 404,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_request" },
      {
        status: 400,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  const parsed = parseCreateBody(payload);
  if (!parsed) {
    return NextResponse.json(
      { error: "invalid_request" },
      {
        status: 400,
        headers: NO_STORE_HEADERS,
      },
    );
  }

  try {
    const created = await createPartnerPortalAccess({
      ownerEmail: parsed.ownerEmail,
      ownerProject: parsed.ownerProject,
      ttlSeconds: parsed.ttlSeconds,
    });

    await logAdminAction({
      action: "partner_portal_token_create",
      targetEmail: parsed.ownerEmail,
      metadata: {
        portalTokenId: created.record.id,
        owner_project: created.record.owner_project,
        expires_at: created.record.expires_at,
      },
    });

    const portalLink = new URL("/portal/login", request.url);
    portalLink.searchParams.set("token", created.rawToken);

    return NextResponse.json(
      {
        ok: true,
        portal_token: {
          id: created.record.id,
          owner_email: created.record.owner_email,
          owner_project: created.record.owner_project,
          created_at: created.record.created_at,
          expires_at: created.record.expires_at,
          revoked_at: created.record.revoked_at,
        },
        raw_token: created.rawToken,
        portal_link: portalLink.toString(),
      },
      {
        status: 201,
        headers: NO_STORE_HEADERS,
      },
    );
  } catch {
    return NextResponse.json(
      { error: "portal_token_create_failed" },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      },
    );
  }
}
