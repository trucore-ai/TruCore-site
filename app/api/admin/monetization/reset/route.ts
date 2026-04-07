/**
 * Admin monetization settings reset proxy.
 *
 * POST → reset settings to defaults via ATF backend
 *
 * Protected by withAdminApiAuth.
 */

import { NextResponse } from "next/server";
import { withAdminApiAuth } from "@/lib/admin-api-auth";
import { resetMonetizationSettings } from "@/lib/dashboard-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const POST = withAdminApiAuth(async () => {
  const result = await resetMonetizationSettings();
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: "reset_failed", message: result.error } },
      { status: 400 },
    );
  }
  return NextResponse.json({ settings: result.data, reset: true });
});
