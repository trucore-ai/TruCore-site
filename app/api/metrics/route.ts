import { NextResponse } from "next/server";
import { getWaitlistMetricsSnapshot } from "@/lib/db";
import { withAdminApiAuth } from "@/lib/admin-api-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = withAdminApiAuth(async () => {
  try {
    const metrics = await getWaitlistMetricsSnapshot();
    return NextResponse.json(metrics, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "metrics_unavailable" },
      { status: 500 },
    );
  }
}, { csrf: false });
