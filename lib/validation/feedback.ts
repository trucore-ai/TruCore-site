/**
 * Zod validation schemas for the feedback feature.
 */

import { z } from "zod";

/* ---------- enums ---------- */

export const FEEDBACK_CATEGORIES = [
  "Feature Request",
  "Bug",
  "Docs",
  "Integration",
  "Question",
] as const;

export const FEEDBACK_STATUSES = [
  "Considering",
  "Planned",
  "In Progress",
  "Shipped",
  "Wont Implement",
] as const;

export const FEEDBACK_SORT_OPTIONS = ["top", "new", "shipped"] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];
export type FeedbackSortOption = (typeof FEEDBACK_SORT_OPTIONS)[number];

/* ---------- schemas ---------- */

export const createFeedbackSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters.")
    .max(120, "Title must be 120 characters or fewer."),
  body: z
    .string()
    .trim()
    .min(20, "Body must be at least 20 characters.")
    .max(4000, "Body must be 4,000 characters or fewer."),
  category: z.enum(FEEDBACK_CATEGORIES, {
    errorMap: () => ({ message: "Please select a valid category." }),
  }),
});

export const updateFeedbackSchema = z.object({
  id: z.string().uuid("Invalid feedback item ID."),
  status: z.enum(FEEDBACK_STATUSES).optional(),
  pinned: z.boolean().optional(),
  hidden: z.boolean().optional(),
});

export const voteFeedbackSchema = z.object({
  feedbackItemId: z.string().uuid("Invalid feedback item ID."),
});

export const listFeedbackSchema = z.object({
  category: z.enum(FEEDBACK_CATEGORIES).optional(),
  status: z.enum(FEEDBACK_STATUSES).optional(),
  sort: z.enum(FEEDBACK_SORT_OPTIONS).optional().default("top"),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>;
export type VoteFeedbackInput = z.infer<typeof voteFeedbackSchema>;
export type ListFeedbackInput = z.infer<typeof listFeedbackSchema>;
