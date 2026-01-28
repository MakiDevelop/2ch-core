/**
 * Moderation Service - Business logic for content moderation
 * Handles batch scanning, flagging, queue management, and user reports
 */

import { Pool } from "pg";
import { checkContentForBoard } from "../guard/contentGuard";

// Note: checkContentForBoard is now async, using database-driven badwords

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Types
export type ModerationStatus =
  | "unscanned"
  | "clean"
  | "pending_review"
  | "approved"
  | "rejected";

export type FlagSource = "system_scan" | "user_report";

export type QueueItem = {
  id: number;
  content: string;
  title: string | null;
  authorName: string;
  boardSlug: string | null;
  boardName: string | null;
  createdAt: Date;
  moderationScore: number | null;
  flaggedCategories: string[] | null;
  flaggedBy: string | null;
  flaggedAt: Date | null;
  reportCount: number;
};

export type ScanResult = {
  scanned: number;
  flagged: number;
  clean: number;
  errors: number;
};

export type ModerationStats = {
  unscanned: number;
  clean: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  totalReports: number;
  todayReports: number;
};

/**
 * Scan unscanned posts and flag problematic content
 */
export async function scanUnscannedPosts(limit: number = 100): Promise<ScanResult> {
  const result: ScanResult = {
    scanned: 0,
    flagged: 0,
    clean: 0,
    errors: 0,
  };

  try {
    // Get unscanned posts
    const postsResult = await pool.query(
      `SELECT p.id, p.content, b.slug as board_slug
       FROM posts p
       LEFT JOIN boards b ON p.board_id = b.id
       WHERE p.moderation_status = 'unscanned'
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [limit]
    );

    for (const post of postsResult.rows) {
      try {
        const checkResult = await checkContentForBoard(post.content, post.board_slug);
        result.scanned++;

        if (checkResult.flagged) {
          // Flag the post
          await pool.query(
            `UPDATE posts
             SET moderation_status = 'pending_review',
                 moderation_score = $1,
                 flagged_categories = $2,
                 flagged_by = 'system_scan',
                 flagged_at = NOW()
             WHERE id = $3`,
            [checkResult.score, checkResult.categories, post.id]
          );
          result.flagged++;
        } else {
          // Mark as clean
          await pool.query(
            `UPDATE posts
             SET moderation_status = 'clean',
                 moderation_score = 0
             WHERE id = $1`,
            [post.id]
          );
          result.clean++;
        }
      } catch (err) {
        console.error(`[MODERATION] Error scanning post ${post.id}:`, err);
        result.errors++;
      }
    }
  } catch (err) {
    console.error("[MODERATION] Error in scanUnscannedPosts:", err);
    throw err;
  }

  return result;
}

/**
 * Flag a specific post for review
 */
export async function flagPost(
  postId: number,
  score: number,
  categories: string[],
  flaggedBy: FlagSource
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE posts
     SET moderation_status = 'pending_review',
         moderation_score = GREATEST(COALESCE(moderation_score, 0), $1),
         flagged_categories = CASE
           WHEN flagged_categories IS NULL THEN $2::text[]
           ELSE (SELECT ARRAY(SELECT DISTINCT unnest(flagged_categories || $2::text[])))
         END,
         flagged_by = COALESCE(flagged_by, $3),
         flagged_at = COALESCE(flagged_at, NOW())
     WHERE id = $4
     RETURNING id`,
    [score, categories, flaggedBy, postId]
  );

  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Get moderation queue with pagination
 */
export async function getModerationQueue(
  limit: number = 20,
  offset: number = 0
): Promise<QueueItem[]> {
  const result = await pool.query(
    `SELECT
       p.id,
       p.content,
       p.title,
       p.author_name,
       p.created_at,
       p.moderation_score,
       p.flagged_categories,
       p.flagged_by,
       p.flagged_at,
       b.slug as board_slug,
       b.name as board_name,
       (SELECT COUNT(*) FROM post_reports r WHERE r.post_id = p.id) as report_count
     FROM posts p
     LEFT JOIN boards b ON p.board_id = b.id
     WHERE p.moderation_status = 'pending_review'
     ORDER BY
       p.moderation_score DESC NULLS LAST,
       p.flagged_at DESC NULLS LAST
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows.map((row) => ({
    id: row.id,
    content: row.content,
    title: row.title,
    authorName: row.author_name,
    boardSlug: row.board_slug,
    boardName: row.board_name,
    createdAt: row.created_at,
    moderationScore: row.moderation_score,
    flaggedCategories: row.flagged_categories,
    flaggedBy: row.flagged_by,
    flaggedAt: row.flagged_at,
    reportCount: parseInt(row.report_count, 10),
  }));
}

/**
 * Get count of pending items in queue
 */
export async function getQueueCount(): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM posts WHERE moderation_status = 'pending_review'`
  );
  return parseInt(result.rows[0].count, 10);
}

/**
 * Approve a post (mark as reviewed and OK)
 */
export async function approvePost(
  postId: number,
  adminIpHash: string
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE posts
     SET moderation_status = 'approved'
     WHERE id = $1 AND moderation_status = 'pending_review'
     RETURNING id`,
    [postId]
  );

  if (result.rowCount && result.rowCount > 0) {
    // Log the action
    await logModerationAction("approve", "post", postId.toString(), adminIpHash);
    return true;
  }

  return false;
}

/**
 * Reject a post (mark as rejected and soft-delete)
 */
export async function rejectPost(
  postId: number,
  adminIpHash: string,
  reason?: string
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE posts
     SET moderation_status = 'rejected',
         status = 2
     WHERE id = $1 AND moderation_status = 'pending_review'
     RETURNING id`,
    [postId]
  );

  if (result.rowCount && result.rowCount > 0) {
    // Log the action
    await logModerationAction(
      "reject",
      "post",
      postId.toString(),
      adminIpHash,
      reason
    );
    return true;
  }

  return false;
}

/**
 * Create a user report
 */
export async function createReport(
  postId: number,
  reporterIpHash: string,
  category: string,
  text?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if post exists and is not deleted
    const postCheck = await pool.query(
      `SELECT id, moderation_status FROM posts WHERE id = $1 AND status != 2`,
      [postId]
    );

    if (postCheck.rows.length === 0) {
      return { success: false, error: "貼文不存在或已被刪除" };
    }

    // Insert report (will fail on duplicate due to unique constraint)
    await pool.query(
      `INSERT INTO post_reports (post_id, reporter_ip_hash, reason_category, reason_text)
       VALUES ($1, $2, $3, $4)`,
      [postId, reporterIpHash, category, text || null]
    );

    // If post is not already in review, flag it
    const post = postCheck.rows[0];
    if (post.moderation_status !== "pending_review") {
      await flagPost(postId, 0.5, [category], "user_report");
    }

    return { success: true };
  } catch (err: any) {
    // Handle duplicate report
    if (err.code === "23505") {
      return { success: false, error: "您已經舉報過這則貼文" };
    }
    console.error("[MODERATION] Error creating report:", err);
    throw err;
  }
}

/**
 * Get report count for a post
 */
export async function getReportCount(postId: number): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) as count FROM post_reports WHERE post_id = $1`,
    [postId]
  );
  return parseInt(result.rows[0].count, 10);
}

/**
 * Get moderation statistics
 */
export async function getModerationStats(): Promise<ModerationStats> {
  const statusCounts = await pool.query(
    `SELECT moderation_status, COUNT(*) as count
     FROM posts
     GROUP BY moderation_status`
  );

  const stats: ModerationStats = {
    unscanned: 0,
    clean: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    totalReports: 0,
    todayReports: 0,
  };

  for (const row of statusCounts.rows) {
    const count = parseInt(row.count, 10);
    switch (row.moderation_status) {
      case "unscanned":
        stats.unscanned = count;
        break;
      case "clean":
        stats.clean = count;
        break;
      case "pending_review":
        stats.pendingReview = count;
        break;
      case "approved":
        stats.approved = count;
        break;
      case "rejected":
        stats.rejected = count;
        break;
    }
  }

  // Get report counts
  const reportCounts = await pool.query(
    `SELECT
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today
     FROM post_reports`
  );

  stats.totalReports = parseInt(reportCounts.rows[0].total, 10);
  stats.todayReports = parseInt(reportCounts.rows[0].today, 10);

  return stats;
}

/**
 * Helper: Log moderation action
 */
async function logModerationAction(
  action: string,
  targetType: string,
  targetId: string,
  adminIpHash: string,
  reason?: string,
  metadata?: any
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO moderation_logs (action, target_type, target_id, admin_ip_hash, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        action,
        targetType,
        targetId,
        adminIpHash,
        reason || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (err) {
    console.error("[AUDIT] Failed to log moderation action:", err);
  }
}
