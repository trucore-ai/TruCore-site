/**
 * Feedback database queries.
 *
 * Uses the same Neon serverless driver and runtime-DDL pattern as lib/db.ts.
 * Tables: feedback_users, feedback_items, feedback_votes.
 */

import { getSQL } from "@/lib/db";

/* ================================================================
   Table bootstrapping
   ================================================================ */

let feedbackTablesEnsured = false;

/**
 * Ensure all feedback tables and indexes exist.
 * Safe to call on every request; uses IF NOT EXISTS and
 * skips DDL after the first successful run per process.
 */
export async function ensureFeedbackTables() {
  if (feedbackTablesEnsured) return;

  const sql = getSQL();

  await sql`
    CREATE TABLE IF NOT EXISTS feedback_users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      github_id     BIGINT NOT NULL UNIQUE,
      username      TEXT NOT NULL,
      display_name  TEXT,
      avatar_url    TEXT,
      email         TEXT,
      is_admin      BOOLEAN NOT NULL DEFAULT false,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS feedback_items (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title         TEXT NOT NULL,
      body          TEXT NOT NULL,
      category      TEXT NOT NULL DEFAULT 'Feature Request',
      status        TEXT NOT NULL DEFAULT 'Considering',
      created_by    UUID NOT NULL REFERENCES feedback_users(id) ON DELETE CASCADE,
      upvote_count  INT NOT NULL DEFAULT 0,
      pinned        BOOLEAN NOT NULL DEFAULT false,
      hidden        BOOLEAN NOT NULL DEFAULT false,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS feedback_votes (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id           UUID NOT NULL REFERENCES feedback_users(id) ON DELETE CASCADE,
      feedback_item_id  UUID NOT NULL REFERENCES feedback_items(id) ON DELETE CASCADE,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(user_id, feedback_item_id)
    );
  `;

  // Indexes for common queries
  await sql`CREATE INDEX IF NOT EXISTS idx_feedback_items_status ON feedback_items(status);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_feedback_items_category ON feedback_items(category);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_feedback_items_pinned ON feedback_items(pinned);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_feedback_items_updated_at ON feedback_items(updated_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_feedback_items_upvote_count ON feedback_items(upvote_count DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_feedback_items_hidden ON feedback_items(hidden);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_feedback_votes_user_id ON feedback_votes(user_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_feedback_votes_item_id ON feedback_votes(feedback_item_id);`;

  feedbackTablesEnsured = true;
}

/* ================================================================
   Type definitions
   ================================================================ */

export interface FeedbackUser {
  id: string;
  github_id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface FeedbackItem {
  id: string;
  title: string;
  body: string;
  category: string;
  status: string;
  created_by: string;
  upvote_count: number;
  pinned: boolean;
  hidden: boolean;
  created_at: string;
  updated_at: string;
  // joined fields
  author_username?: string;
  author_avatar_url?: string | null;
  user_has_voted?: boolean;
}

export interface FeedbackVote {
  id: string;
  user_id: string;
  feedback_item_id: string;
  created_at: string;
}

/* ================================================================
   User queries
   ================================================================ */

export async function upsertFeedbackUser(params: {
  github_id: number;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  is_admin: boolean;
}): Promise<FeedbackUser> {
  await ensureFeedbackTables();
  const sql = getSQL();

  const rows = await sql`
    INSERT INTO feedback_users (github_id, username, display_name, avatar_url, email, is_admin)
    VALUES (${params.github_id}, ${params.username}, ${params.display_name}, ${params.avatar_url}, ${params.email}, ${params.is_admin})
    ON CONFLICT (github_id) DO UPDATE SET
      username     = EXCLUDED.username,
      display_name = EXCLUDED.display_name,
      avatar_url   = EXCLUDED.avatar_url,
      email        = EXCLUDED.email,
      is_admin     = EXCLUDED.is_admin
    RETURNING *;
  `;
  return rows[0] as FeedbackUser;
}

export async function getFeedbackUserById(
  id: string,
): Promise<FeedbackUser | null> {
  await ensureFeedbackTables();
  const sql = getSQL();
  const rows = await sql`
    SELECT * FROM feedback_users WHERE id = ${id} LIMIT 1;
  `;
  return (rows[0] as FeedbackUser) ?? null;
}

/* ================================================================
   Feedback item queries
   ================================================================ */

export async function createFeedbackItem(params: {
  title: string;
  body: string;
  category: string;
  created_by: string;
}): Promise<FeedbackItem> {
  await ensureFeedbackTables();
  const sql = getSQL();

  const rows = await sql`
    INSERT INTO feedback_items (title, body, category, created_by)
    VALUES (${params.title}, ${params.body}, ${params.category}, ${params.created_by})
    RETURNING *;
  `;
  return rows[0] as FeedbackItem;
}

export type FeedbackSort = "top" | "new" | "shipped";

export async function listFeedbackItems(params: {
  category?: string;
  status?: string;
  sort?: FeedbackSort;
  userId?: string | null;
  includeHidden?: boolean;
}): Promise<FeedbackItem[]> {
  await ensureFeedbackTables();
  const sql = getSQL();

  const {
    category,
    status,
    sort = "top",
    userId,
    includeHidden = false,
  } = params;

  // Build the query with dynamic filters
  // We use a CTE to handle the optional user vote join
  const rows = await sql`
    SELECT
      fi.*,
      fu.username AS author_username,
      fu.avatar_url AS author_avatar_url,
      CASE WHEN fv.id IS NOT NULL THEN true ELSE false END AS user_has_voted
    FROM feedback_items fi
    LEFT JOIN feedback_users fu ON fu.id = fi.created_by
    LEFT JOIN feedback_votes fv
      ON fv.feedback_item_id = fi.id
      AND fv.user_id = ${userId ?? "00000000-0000-0000-0000-000000000000"}
    WHERE 1=1
      AND (${!includeHidden}::boolean IS FALSE OR fi.hidden = false)
      AND (${category ?? ""}::text = '' OR fi.category = ${category ?? ""})
      AND (${status ?? ""}::text = '' OR fi.status = ${status ?? ""})
    ORDER BY
      fi.pinned DESC,
      CASE
        WHEN ${sort} = 'top' THEN fi.upvote_count
        ELSE 0
      END DESC,
      CASE
        WHEN ${sort} = 'new' THEN EXTRACT(EPOCH FROM fi.created_at)
        ELSE 0
      END DESC,
      CASE
        WHEN ${sort} = 'shipped' THEN CASE WHEN fi.status = 'Shipped' THEN 1 ELSE 0 END
        ELSE 0
      END DESC,
      fi.updated_at DESC;
  `;

  return rows as FeedbackItem[];
}

export async function getFeedbackItemById(
  id: string,
  userId?: string | null,
): Promise<FeedbackItem | null> {
  await ensureFeedbackTables();
  const sql = getSQL();

  const rows = await sql`
    SELECT
      fi.*,
      fu.username AS author_username,
      fu.avatar_url AS author_avatar_url,
      CASE WHEN fv.id IS NOT NULL THEN true ELSE false END AS user_has_voted
    FROM feedback_items fi
    LEFT JOIN feedback_users fu ON fu.id = fi.created_by
    LEFT JOIN feedback_votes fv
      ON fv.feedback_item_id = fi.id
      AND fv.user_id = ${userId ?? "00000000-0000-0000-0000-000000000000"}
    WHERE fi.id = ${id}
    LIMIT 1;
  `;

  return (rows[0] as FeedbackItem) ?? null;
}

export async function updateFeedbackItem(
  id: string,
  updates: {
    status?: string;
    pinned?: boolean;
    hidden?: boolean;
  },
): Promise<FeedbackItem | null> {
  await ensureFeedbackTables();
  const sql = getSQL();

  const rows = await sql`
    UPDATE feedback_items
    SET
      status     = COALESCE(${updates.status ?? null}, status),
      pinned     = COALESCE(${updates.pinned ?? null}, pinned),
      hidden     = COALESCE(${updates.hidden ?? null}, hidden),
      updated_at = now()
    WHERE id = ${id}
    RETURNING *;
  `;

  return (rows[0] as FeedbackItem) ?? null;
}

/* ================================================================
   Vote queries
   ================================================================ */

export async function toggleVote(
  userId: string,
  feedbackItemId: string,
): Promise<{ voted: boolean; newCount: number }> {
  await ensureFeedbackTables();
  const sql = getSQL();

  // Check if vote exists
  const existing = await sql`
    SELECT id FROM feedback_votes
    WHERE user_id = ${userId} AND feedback_item_id = ${feedbackItemId}
    LIMIT 1;
  `;

  if (existing.length > 0) {
    // Remove vote
    await sql`
      DELETE FROM feedback_votes
      WHERE user_id = ${userId} AND feedback_item_id = ${feedbackItemId};
    `;
    const updated = await sql`
      UPDATE feedback_items
      SET upvote_count = GREATEST(upvote_count - 1, 0), updated_at = now()
      WHERE id = ${feedbackItemId}
      RETURNING upvote_count;
    `;
    return { voted: false, newCount: updated[0]?.upvote_count ?? 0 };
  } else {
    // Add vote
    await sql`
      INSERT INTO feedback_votes (user_id, feedback_item_id)
      VALUES (${userId}, ${feedbackItemId})
      ON CONFLICT (user_id, feedback_item_id) DO NOTHING;
    `;
    const updated = await sql`
      UPDATE feedback_items
      SET upvote_count = upvote_count + 1, updated_at = now()
      WHERE id = ${feedbackItemId}
      RETURNING upvote_count;
    `;
    return { voted: true, newCount: updated[0]?.upvote_count ?? 0 };
  }
}
