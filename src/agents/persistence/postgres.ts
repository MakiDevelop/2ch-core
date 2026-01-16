import { Pool } from "pg";

export type LinkPreview = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
} | null;

export type Post = {
  id: number;
  content: string;
  status: number;
  ipHash: string;
  createdAt: Date;
  parentId: number | null;
  boardId?: number | null;
  title?: string | null;
  authorName: string;
  linkPreview?: LinkPreview;
};

export type CreatePostParams = {
  content: string;
  status?: number;
  ipHash: string;
  realIp?: string; // DEPRECATED: Will be removed in future migration for security
  userAgent: string;
  parentId?: number | null;
  boardId?: number | null;
  title?: string | null;
  authorName?: string;
  linkPreview?: LinkPreview;
};

export type ThreadDetail = {
  id: number;
  content: string;
  status: number;
  ipHash: string;
  createdAt: Date;
  parentId: number | null;
  replyCount: number;
  lastReplyAt: Date | null;
  boardId?: number | null;
  title?: string | null;
  authorName: string;
  board?: { slug: string; name: string } | null;
  linkPreview?: LinkPreview;
};

export type Board = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  threadCount?: number;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function createPost(params: CreatePostParams): Promise<Post> {
  const {
    content,
    status,
    ipHash,
    realIp, // DEPRECATED: Kept for backward compatibility but not stored
    userAgent,
    parentId,
    boardId,
    title,
    authorName,
    linkPreview,
  } = params;

  const finalAuthorName = authorName || "名無しさん";
  const finalStatus = status ?? 0;

  // SECURITY FIX: Removed real_ip from INSERT to prevent plaintext IP storage
  const result = await pool.query(
    `INSERT INTO posts (
      content, status, ip_hash, user_agent,
      parent_id, board_id, title, author_name, link_preview
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, content, status, ip_hash, created_at, parent_id, board_id, title, author_name, link_preview`,
    [
      content,
      finalStatus,
      ipHash,
      userAgent,
      parentId ?? null,
      boardId ?? null,
      title ?? null,
      finalAuthorName,
      linkPreview ? JSON.stringify(linkPreview) : null,
    ],
  );

  const row = result.rows[0];
  return {
    id: row.id,
    content: row.content,
    status: row.status,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
    parentId: row.parent_id,
    boardId: row.board_id,
    title: row.title,
    authorName: row.author_name,
    linkPreview: row.link_preview,
  };
}

export async function listPosts(limit: number): Promise<Post[]> {
  const result = await pool.query(
    "SELECT id, content, status, ip_hash, created_at, parent_id, board_id, title, author_name FROM posts ORDER BY id DESC LIMIT $1",
    [limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    content: row.content,
    status: row.status,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
    parentId: row.parent_id,
    boardId: row.board_id,
    title: row.title,
    authorName: row.author_name,
  }));
}

/**
 * 列出最新討論串（僅主帖，不含回覆）
 */
export async function listThreads(limit: number): Promise<ThreadDetail[]> {
  const result = await pool.query(
    `SELECT
      p.id, p.content, p.status, p.ip_hash, p.created_at, p.parent_id,
      p.title, p.author_name, p.board_id,
      b.slug as board_slug, b.name as board_name,
      (SELECT COUNT(*) FROM posts r WHERE r.parent_id = p.id) as reply_count
    FROM posts p
    LEFT JOIN boards b ON b.id = p.board_id
    WHERE p.parent_id IS NULL
    ORDER BY p.created_at DESC
    LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    content: row.content,
    status: row.status,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
    parentId: row.parent_id,
    boardId: row.board_id,
    title: row.title,
    authorName: row.author_name,
    boardSlug: row.board_slug,
    boardName: row.board_name,
    replyCount: parseInt(row.reply_count, 10) || 0,
  }));
}

/**
 * 列出最近有回覆的討論串（按最後回覆時間排序）
 */
export async function listThreadsByLastReply(limit: number): Promise<ThreadDetail[]> {
  const result = await pool.query(
    `SELECT
      p.id, p.content, p.status, p.ip_hash, p.created_at, p.parent_id,
      p.title, p.author_name, p.board_id,
      b.slug as board_slug, b.name as board_name,
      (SELECT COUNT(*) FROM posts r WHERE r.parent_id = p.id) as reply_count,
      (SELECT MAX(r.created_at) FROM posts r WHERE r.parent_id = p.id) as last_reply_at
    FROM posts p
    LEFT JOIN boards b ON b.id = p.board_id
    WHERE p.parent_id IS NULL
    ORDER BY last_reply_at DESC NULLS LAST
    LIMIT $1`,
    [limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    content: row.content,
    status: row.status,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
    lastReplyAt: row.last_reply_at,
    parentId: row.parent_id,
    boardId: row.board_id,
    title: row.title,
    authorName: row.author_name,
    boardSlug: row.board_slug,
    boardName: row.board_name,
    replyCount: parseInt(row.reply_count, 10) || 0,
  }));
}

/**
 * 全站搜尋討論串（標題 + 內文）
 */
export async function searchThreads(
  query: string,
  limit: number = 20,
): Promise<ThreadDetail[]> {
  // 轉義 LIKE 特殊字元，防止 pattern injection
  const escapedQuery = query
    .replace(/\\/g, "\\\\") // 先轉義反斜線
    .replace(/%/g, "\\%")   // 轉義 %
    .replace(/_/g, "\\_");  // 轉義 _
  const searchPattern = `%${escapedQuery}%`;
  const result = await pool.query(
    `SELECT
      p.id, p.content, p.status, p.ip_hash, p.created_at, p.parent_id,
      p.title, p.author_name, p.board_id,
      b.slug as board_slug, b.name as board_name,
      (SELECT COUNT(*) FROM posts r WHERE r.parent_id = p.id) as reply_count,
      (SELECT MAX(r.created_at) FROM posts r WHERE r.parent_id = p.id) as last_reply_at
    FROM posts p
    LEFT JOIN boards b ON b.id = p.board_id
    WHERE p.parent_id IS NULL
      AND (p.title ILIKE $1 OR p.content ILIKE $1)
    ORDER BY p.created_at DESC
    LIMIT $2`,
    [searchPattern, limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    content: row.content,
    status: row.status,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
    lastReplyAt: row.last_reply_at,
    parentId: row.parent_id,
    boardId: row.board_id,
    title: row.title,
    authorName: row.author_name,
    boardSlug: row.board_slug,
    boardName: row.board_name,
    replyCount: parseInt(row.reply_count, 10) || 0,
  }));
}

/**
 * 获取指定主题的详细信息（含回复统计）
 */
export async function getThreadById(
  id: number,
): Promise<ThreadDetail | null> {
  // 使用子查詢取代 self-join
  const result = await pool.query(
    `SELECT
      p.id, p.content, p.status, p.ip_hash, p.created_at, p.parent_id,
      p.title, p.author_name, p.board_id, p.link_preview,
      b.slug as board_slug, b.name as board_name,
      (SELECT COUNT(*) FROM posts r WHERE r.parent_id = p.id) as reply_count,
      (SELECT MAX(r.created_at) FROM posts r WHERE r.parent_id = p.id) as last_reply_at
    FROM posts p
    LEFT JOIN boards b ON b.id = p.board_id
    WHERE p.id = $1`,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    content: row.content,
    status: row.status,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
    parentId: row.parent_id,
    title: row.title,
    authorName: row.author_name,
    boardId: row.board_id,
    board: row.board_slug
      ? { slug: row.board_slug, name: row.board_name }
      : null,
    replyCount: parseInt(row.reply_count, 10),
    lastReplyAt: row.last_reply_at,
    linkPreview: row.link_preview,
  };
}

/**
 * 获取指定主题的所有回复
 */
export async function getReplies(
  threadId: number,
  limit: number,
  offset: number,
): Promise<Post[]> {
  const result = await pool.query(
    `SELECT id, content, status, ip_hash, created_at, parent_id, board_id, title, author_name, link_preview
    FROM posts
    WHERE parent_id = $1
    ORDER BY id ASC
    LIMIT $2 OFFSET $3`,
    [threadId, limit, offset],
  );

  return result.rows.map((row) => ({
    id: row.id,
    content: row.content,
    status: row.status,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
    parentId: row.parent_id,
    boardId: row.board_id,
    title: row.title,
    authorName: row.author_name,
    linkPreview: row.link_preview,
  }));
}

/**
 * 获取所有板块列表（含主题数统计）
 */
export async function listBoards(): Promise<Board[]> {
  // 使用子查詢取代 JOIN + GROUP BY
  const result = await pool.query(
    `SELECT
      b.id, b.slug, b.name, b.description, b.display_order, b.is_active, b.created_at,
      (SELECT COUNT(*) FROM posts p WHERE p.board_id = b.id AND p.parent_id IS NULL) as thread_count
    FROM boards b
    WHERE b.is_active = true
    ORDER BY b.display_order ASC`,
  );

  return result.rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    displayOrder: row.display_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    threadCount: parseInt(row.thread_count, 10),
  }));
}

/**
 * 根据 slug 获取板块详情
 */
export async function getBoardBySlug(slug: string): Promise<Board | null> {
  // 使用子查詢取代 JOIN + GROUP BY
  const result = await pool.query(
    `SELECT
      b.id, b.slug, b.name, b.description, b.display_order, b.is_active, b.created_at,
      (SELECT COUNT(*) FROM posts p WHERE p.board_id = b.id AND p.parent_id IS NULL) as thread_count
    FROM boards b
    WHERE b.slug = $1 AND b.is_active = true`,
    [slug],
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    displayOrder: row.display_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    threadCount: parseInt(row.thread_count, 10),
  };
}

/**
 * 排序方式類型
 */
export type ThreadSortType = 'latest' | 'hot';

/**
 * 获取指定板块的主题列表
 * @param sort - 排序方式：'latest'（最新發文）或 'hot'（熱門，按回覆數）
 */
export async function getBoardThreads(
  boardId: number,
  limit: number,
  offset: number,
  sort: ThreadSortType = 'latest',
): Promise<ThreadDetail[]> {
  // 根據排序方式決定 ORDER BY
  const orderClause = sort === 'hot'
    ? 'ORDER BY reply_count DESC, p.created_at DESC'
    : 'ORDER BY p.created_at DESC';

  // 使用子查詢取代 self-join，效能更好
  // 子查詢只對 LIMIT 後的結果計算，而非全部 threads
  const result = await pool.query(
    `SELECT
      p.id, p.content, p.status, p.ip_hash, p.created_at, p.parent_id, p.board_id,
      p.title, p.author_name,
      (SELECT COUNT(*) FROM posts r WHERE r.parent_id = p.id) as reply_count,
      (SELECT MAX(r.created_at) FROM posts r WHERE r.parent_id = p.id) as last_reply_at
    FROM posts p
    WHERE p.board_id = $1 AND p.parent_id IS NULL
    ${orderClause}
    LIMIT $2 OFFSET $3`,
    [boardId, limit, offset],
  );

  return result.rows.map((row) => ({
    id: row.id,
    content: row.content,
    status: row.status,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
    parentId: row.parent_id,
    title: row.title,
    authorName: row.author_name,
    boardId: row.board_id,
    replyCount: parseInt(row.reply_count, 10),
    lastReplyAt: row.last_reply_at,
  }));
}

/**
 * 辅助函数：写入管理操作日志
 */
async function logModerationAction(
  action: string,
  targetType: string,
  targetId: string,
  adminIpHash: string,
  reason?: string,
  metadata?: any,
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO moderation_logs (action, target_type, target_id, admin_ip_hash, reason, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [action, targetType, targetId, adminIpHash, reason || null, metadata ? JSON.stringify(metadata) : null],
    );
  } catch (err) {
    console.error(`[AUDIT] Failed to log moderation action:`, err);
    // 不中断主要操作流程
  }
}

/**
 * 管理功能：软删除主题或回复
 * status: 0=正常, 1=锁定, 2=已删除
 */
export async function deletePost(
  postId: number,
  reason: string,
  adminIpHash: string,
): Promise<boolean> {
  const result = await pool.query(
    `UPDATE posts SET status = 2 WHERE id = $1 RETURNING id`,
    [postId],
  );

  if (result.rowCount && result.rowCount > 0) {
    // 写入审计日志
    await logModerationAction(
      'delete',
      'post',
      postId.toString(),
      adminIpHash,
      reason,
    );

    console.log(
      `[ADMIN] Post ${postId} deleted by ${adminIpHash}. Reason: ${reason}`,
    );
    return true;
  }

  return false;
}

/**
 * 管理功能：锁定主题（禁止回复）
 */
export async function lockPost(postId: number, adminIpHash: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE posts SET status = 1 WHERE id = $1 AND parent_id IS NULL RETURNING id`,
    [postId],
  );

  if (result.rowCount && result.rowCount > 0) {
    await logModerationAction(
      'lock',
      'post',
      postId.toString(),
      adminIpHash,
      'Thread locked',
    );
  }

  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * 管理功能：解锁主题
 */
export async function unlockPost(postId: number, adminIpHash: string): Promise<boolean> {
  const result = await pool.query(
    `UPDATE posts SET status = 0 WHERE id = $1 AND parent_id IS NULL RETURNING id`,
    [postId],
  );

  if (result.rowCount && result.rowCount > 0) {
    await logModerationAction(
      'unlock',
      'post',
      postId.toString(),
      adminIpHash,
      'Thread unlocked',
    );
  }

  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * 管理功能：按 IP Hash 批量删除
 */
export async function deletePostsByIpHash(
  ipHash: string,
  reason: string,
  adminIpHash: string,
): Promise<number> {
  const result = await pool.query(
    `UPDATE posts SET status = 2 WHERE ip_hash = $1 AND status != 2 RETURNING id`,
    [ipHash],
  );

  const count = result.rowCount ?? 0;

  if (count > 0) {
    // 写入审计日志
    await logModerationAction(
      'ban_ip',
      'ip_hash',
      ipHash,
      adminIpHash,
      reason,
      { affected_count: count },
    );

    console.log(
      `[ADMIN] ${count} posts from ${ipHash} deleted by ${adminIpHash}. Reason: ${reason}`,
    );
  }

  return count;
}

/**
 * 管理功能：检查主题是否被锁定
 */
export async function isThreadLocked(threadId: number): Promise<boolean> {
  const result = await pool.query(
    `SELECT status FROM posts WHERE id = $1 AND parent_id IS NULL`,
    [threadId],
  );

  if (result.rows.length === 0) {
    return false;
  }

  return result.rows[0].status === 1;
}

/**
 * 獲取資料庫統計資訊（用於系統狀態監控）
 */
export async function getSystemStats(): Promise<any> {
  try {
    // 獲取資料庫連線狀態
    const connResult = await pool.query('SELECT version(), current_database(), current_user');

    // 獲取各資料表統計
    const boardsCount = await pool.query('SELECT COUNT(*) as count FROM boards');
    const postsCount = await pool.query('SELECT COUNT(*) as count FROM posts WHERE status = 0');
    const deletedPostsCount = await pool.query('SELECT COUNT(*) as count FROM posts WHERE status = 2');
    const threadsCount = await pool.query('SELECT COUNT(*) as count FROM posts WHERE parent_id IS NULL AND status = 0');
    const repliesCount = await pool.query('SELECT COUNT(*) as count FROM posts WHERE parent_id IS NOT NULL AND status = 0');
    const moderationLogsCount = await pool.query('SELECT COUNT(*) as count FROM moderation_logs');

    // 獲取今日統計
    const todayPosts = await pool.query(
      `SELECT COUNT(*) as count FROM posts WHERE created_at >= CURRENT_DATE`
    );
    const todayThreads = await pool.query(
      `SELECT COUNT(*) as count FROM posts WHERE parent_id IS NULL AND created_at >= CURRENT_DATE`
    );

    // 資料庫大小
    const dbSize = await pool.query(
      `SELECT pg_size_pretty(pg_database_size(current_database())) as size`
    );

    return {
      connected: true,
      version: connResult.rows[0].version,
      database: connResult.rows[0].current_database,
      user: connResult.rows[0].current_user,
      size: dbSize.rows[0].size,
      stats: {
        boards: parseInt(boardsCount.rows[0].count),
        posts: parseInt(postsCount.rows[0].count),
        deletedPosts: parseInt(deletedPostsCount.rows[0].count),
        threads: parseInt(threadsCount.rows[0].count),
        replies: parseInt(repliesCount.rows[0].count),
        moderationLogs: parseInt(moderationLogsCount.rows[0].count),
        todayPosts: parseInt(todayPosts.rows[0].count),
        todayThreads: parseInt(todayThreads.rows[0].count),
      },
    };
  } catch (error) {
    console.error('[DB-STATS] Error:', error);
    return {
      connected: false,
      error: 'Failed to get database stats',
    };
  }
}

/**
 * 獲取 Sitemap 資料（用於 SEO）
 * 返回所有活躍討論串的 ID 和最後更新時間
 */
export interface SitemapEntry {
  id: number;
  updatedAt: Date;
  boardSlug: string;
}

export async function getSitemapData(): Promise<{
  threads: SitemapEntry[];
  boards: { slug: string; updatedAt: Date }[];
}> {
  // 獲取所有活躍討論串（含最新回覆時間）
  const threadsResult = await pool.query(`
    SELECT
      t.id,
      b.slug as board_slug,
      GREATEST(
        t.created_at,
        COALESCE((SELECT MAX(created_at) FROM posts WHERE parent_id = t.id), t.created_at)
      ) as updated_at
    FROM posts t
    JOIN boards b ON t.board_id = b.id
    WHERE t.parent_id IS NULL
      AND t.status = 0
    ORDER BY updated_at DESC
    LIMIT 1000
  `);

  // 獲取所有板塊（含最新討論串時間）
  const boardsResult = await pool.query(`
    SELECT
      b.slug,
      COALESCE(MAX(p.created_at), b.created_at) as updated_at
    FROM boards b
    LEFT JOIN posts p ON p.board_id = b.id AND p.parent_id IS NULL AND p.status = 0
    GROUP BY b.id, b.slug, b.created_at
    ORDER BY updated_at DESC
  `);

  return {
    threads: threadsResult.rows.map(row => ({
      id: row.id,
      updatedAt: row.updated_at,
      boardSlug: row.board_slug,
    })),
    boards: boardsResult.rows.map(row => ({
      slug: row.slug,
      updatedAt: row.updated_at,
    })),
  };
}
