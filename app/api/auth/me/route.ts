/**
 * Return the current feedback user (or null if not signed in).
 */

import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/feedback-auth";
import { getFeedbackUserById } from "@/lib/feedback-db";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ user: null });
  }

  const user = await getFeedbackUserById(userId);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      is_admin: user.is_admin,
    },
  });
}
