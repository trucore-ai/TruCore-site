/**
 * Admin monetization settings proxy.
 *
 * GET  → fetch current settings from ATF backend
 * POST → partial update of settings
 *
 * Protected by withAdminApiAuth — unauthenticated requests
 * receive a generic 404 (no detail leakage).
 */

import { NextRequest, NextResponse } from "next/server";
import { withAdminApiAuth } from "@/lib/admin-api-auth";
import {
  fetchMonetizationSettings,
  updateMonetizationSettings,
} from "@/lib/dashboard-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const GET = withAdminApiAuth(async () => {
  const result = await fetchMonetizationSettings();
  if (!result.ok) {
    return NextResponse.json(
      { error: "monetization_settings_unavailable" },
      { status: 502 },
    );
  }
  return NextResponse.json({ settings: result.data });
}, { csrf: false });

export const POST = withAdminApiAuth(async (request: NextRequest) => {
  const body = await request.json();
  const result = await updateMonetizationSettings(body);
  if (!result.ok) {
    return NextResponse.json(
      { error: { code: "update_failed", message: result.error } },
      { status: 400 },
    );
  }
  return NextResponse.json({ settings: result.data });
});
