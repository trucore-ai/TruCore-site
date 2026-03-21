import { NextRequest, NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin-auth";
import { logSecurityEvent } from "@/lib/security-log";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ featureKey: string }> },
) {
  const isValid = await getAdminSessionFromCookies();
  if (!isValid) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { featureKey } = await params;
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
      `${base}/admin/features/${encodeURIComponent(featureKey)}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );
    const data = await res.json();

    logSecurityEvent("admin_feature_policy_updated", {
      meta: { featureKey, patch: body },
    });

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach ATF backend" },
      { status: 502 },
    );
  }
}
