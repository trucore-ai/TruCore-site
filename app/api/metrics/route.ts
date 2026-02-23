import { NextResponse } from "next/server";
import { assertAdminSession } from "@/lib/admin-auth";
import { getWaitlistMetricsSnapshot } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await assertAdminSession();
  } catch {
    return NextResponse.json(
      { error: "not_found" },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  try {
    const metrics = await getWaitlistMetricsSnapshot();
    return NextResponse.json(metrics, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "metrics_unavailable" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
