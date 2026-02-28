/**
 * Server actions for the feedback feature.
 *
 * All mutating actions require authentication.
 * Admin actions require the user to have admin privileges.
 * Rate limiting applied to create and vote operations.
 */

"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSessionUserId } from "@/lib/feedback-auth";
import {
  createFeedbackItem,
  getFeedbackItemById,
  getFeedbackUserById,
  listFeedbackItems,
  toggleVote,
  updateFeedbackItem,
  type FeedbackItem,
} from "@/lib/feedback-db";
import {
  createFeedbackSchema,
  updateFeedbackSchema,
  voteFeedbackSchema,
  listFeedbackSchema,
  type FeedbackSortOption,
} from "@/lib/validation/feedback";
import { consumeRateLimit } from "@/lib/rate-limit";

/* ---------- helpers ---------- */

interface ActionResult<T = undefined> {
  ok: boolean;
  message: string;
  data?: T;
}

async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown"
  );
}

function rateLimitCheck(key: string, max: number, windowMs: number): string | null {
  const result = consumeRateLimit(key, { max, windowMs });
  if (result.exceeded) {
    return "Too many requests. Please wait a moment before trying again.";
  }
  return null;
}

/* ---------- create feedback ---------- */

export async function submitFeedback(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  // Auth check
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, message: "Please sign in with GitHub to submit feedback." };
  }

  // Rate limit: 5 submissions per 10 minutes per user, 10 per IP
  const ip = await getClientIp();
  const userLimitError = rateLimitCheck(`fb-create:user:${userId}`, 5, 600_000);
  if (userLimitError) return { ok: false, message: userLimitError };
  const ipLimitError = rateLimitCheck(`fb-create:ip:${ip}`, 10, 600_000);
  if (ipLimitError) return { ok: false, message: ipLimitError };

  // Validate
  const raw = {
    title: formData.get("title"),
    body: formData.get("body"),
    category: formData.get("category"),
  };

  const parsed = createFeedbackSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Invalid input.";
    return { ok: false, message: firstError };
  }

  try {
    const item = await createFeedbackItem({
      title: parsed.data.title,
      body: parsed.data.body,
      category: parsed.data.category,
      created_by: userId,
    });

    revalidatePath("/feedback");
    return {
      ok: true,
      message: "Feedback submitted. Thank you for contributing.",
      data: { id: item.id },
    };
  } catch (err) {
    console.error("Failed to create feedback item:", err);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

/* ---------- vote ---------- */

export async function voteFeedback(
  feedbackItemId: string,
): Promise<ActionResult<{ voted: boolean; newCount: number }>> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, message: "Please sign in with GitHub to vote." };
  }

  // Rate limit: 30 votes per minute per user
  const limitError = rateLimitCheck(`fb-vote:user:${userId}`, 30, 60_000);
  if (limitError) return { ok: false, message: limitError };

  const parsed = voteFeedbackSchema.safeParse({ feedbackItemId });
  if (!parsed.success) {
    return { ok: false, message: "Invalid item ID." };
  }

  try {
    const result = await toggleVote(userId, parsed.data.feedbackItemId);
    revalidatePath("/feedback");
    revalidatePath(`/feedback/${parsed.data.feedbackItemId}`);
    return {
      ok: true,
      message: result.voted ? "Upvoted." : "Vote removed.",
      data: result,
    };
  } catch (err) {
    console.error("Failed to toggle vote:", err);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

/* ---------- admin update ---------- */

export async function adminUpdateFeedback(
  formData: FormData,
): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, message: "Authentication required." };
  }

  const user = await getFeedbackUserById(userId);
  if (!user?.is_admin) {
    return { ok: false, message: "Admin access required." };
  }

  const raw = {
    id: formData.get("id"),
    status: formData.get("status") || undefined,
    pinned: formData.get("pinned") === "true",
    hidden: formData.get("hidden") === "true",
  };

  const parsed = updateFeedbackSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Invalid input.";
    return { ok: false, message: firstError };
  }

  try {
    await updateFeedbackItem(parsed.data.id, {
      status: parsed.data.status,
      pinned: parsed.data.pinned,
      hidden: parsed.data.hidden,
    });

    revalidatePath("/feedback");
    revalidatePath(`/feedback/${parsed.data.id}`);
    return { ok: true, message: "Feedback item updated." };
  } catch (err) {
    console.error("Failed to update feedback item:", err);
    return { ok: false, message: "Something went wrong. Please try again." };
  }
}

/* ---------- read (for client components) ---------- */

export async function fetchFeedbackItems(params: {
  category?: string;
  status?: string;
  sort?: string;
}): Promise<FeedbackItem[]> {
  const parsed = listFeedbackSchema.safeParse(params);
  const userId = await getSessionUserId();

  return listFeedbackItems({
    category: parsed.success ? parsed.data.category : undefined,
    status: parsed.success ? parsed.data.status : undefined,
    sort: (parsed.success ? parsed.data.sort : "top") as FeedbackSortOption,
    userId,
    includeHidden: false,
  });
}

export async function fetchFeedbackItem(
  id: string,
): Promise<FeedbackItem | null> {
  const userId = await getSessionUserId();
  const item = await getFeedbackItemById(id, userId);
  if (item?.hidden) return null;
  return item;
}
