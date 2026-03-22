import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { logSecurityEvent } from "@/lib/security-log";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string; action: string }> },
) {
  const isValid = await getAdminSessionFromCookies();
  if (!isValid) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { requestId, action } = await params;

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json(
      { error: "Invalid action. Must be 'approve' or 'reject'." },
      { status: 400 },
    );
  }

  const body = await req.json();

  const base = process.env.NEXT_PUBLIC_ATF_DASHBOARD_URL?.replace(/\/+$/, "");
  if (!base) {
    return NextResponse.json(
      { error: "ATF dashboard URL not configured" },
      { status: 500 },
    );
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const apiKey = process.env.ATF_API_KEY;
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  try {
    const res = await fetch(
      `${base}/admin/upgrades/${encodeURIComponent(requestId)}/${action}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );
    const data = await res.json();

    logSecurityEvent(
      action === "approve" ? "admin_upgrade_approve" : "admin_upgrade_reject",
      {
        meta: { requestId, note: body.note || "" },
      },
    );

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach ATF backend" },
      { status: 502 },
    );
  }
}
