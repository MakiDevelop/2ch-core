import { Pool } from "pg";

export type Post = {
  id: number;
  content: string;
  status: number;
  ipHash: string;
  createdAt: Date;
  parentId: number | null;
  boardId?: number | null;
};

export type CreatePostParams = {
  content: string;
  status?: number;
  ipHash: string;
  parentId?: number | null;
  boardId?: number | null;
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
  const { content, status, ipHash, parentId, boardId } = params;

  if (status === undefined) {
    const result = await pool.query(
      "INSERT INTO posts (content, ip_hash, parent_id, board_id) VALUES ($1, $2, $3, $4) RETURNING id, content, status, ip_hash, created_at, parent_id, board_id",
      [content, ipHash, parentId ?? null, boardId ?? null],
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
    };
  }

  const result = await pool.query(
    "INSERT INTO posts (content, status, ip_hash, parent_id, board_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, content, status, ip_hash, created_at, parent_id, board_id",
    [content, status, ipHash, parentId ?? null, boardId ?? null],
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
  };
}

export async function listPosts(limit: number): Promise<Post[]> {
  const result = await pool.query(
    "SELECT id, content, status, ip_hash, created_at FROM posts ORDER BY id DESC LIMIT $1",
    [limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    content: row.content,
    status: row.status,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
  }));
}

/**
 * 获取指定主题的详细信息（含回复统计）
 */
export async function getThreadById(
  id: number,
): Promise<ThreadDetail | null> {
  const result = await pool.query(
    `SELECT
      p.id, p.content, p.status, p.ip_hash, p.created_at, p.parent_id,
      COUNT(r.id) as reply_count,
      MAX(r.created_at) as last_reply_at
    FROM posts p
    LEFT JOIN posts r ON r.parent_id = p.id
    WHERE p.id = $1
    GROUP BY p.id`,
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
    replyCount: parseInt(row.reply_count, 10),
    lastReplyAt: row.last_reply_at,
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
    `SELECT id, content, status, ip_hash, created_at, parent_id
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
  }));
}

/**
 * 获取所有板块列表（含主题数统计）
 */
export async function listBoards(): Promise<Board[]> {
  const result = await pool.query(
    `SELECT
      b.id, b.slug, b.name, b.description, b.display_order, b.is_active, b.created_at,
      COUNT(p.id) FILTER (WHERE p.parent_id IS NULL) as thread_count
    FROM boards b
    LEFT JOIN posts p ON p.board_id = b.id
    WHERE b.is_active = true
    GROUP BY b.id
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
  const result = await pool.query(
    `SELECT
      b.id, b.slug, b.name, b.description, b.display_order, b.is_active, b.created_at,
      COUNT(p.id) FILTER (WHERE p.parent_id IS NULL) as thread_count
    FROM boards b
    LEFT JOIN posts p ON p.board_id = b.id
    WHERE b.slug = $1 AND b.is_active = true
    GROUP BY b.id`,
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
 * 获取指定板块的主题列表
 */
export async function getBoardThreads(
  boardId: number,
  limit: number,
  offset: number,
): Promise<ThreadDetail[]> {
  const result = await pool.query(
    `SELECT
      p.id, p.content, p.status, p.ip_hash, p.created_at, p.parent_id, p.board_id,
      COUNT(r.id) as reply_count,
      MAX(r.created_at) as last_reply_at
    FROM posts p
    LEFT JOIN posts r ON r.parent_id = p.id
    WHERE p.board_id = $1 AND p.parent_id IS NULL
    GROUP BY p.id
    ORDER BY p.created_at DESC
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
    replyCount: parseInt(row.reply_count, 10),
    lastReplyAt: row.last_reply_at,
    boardId: row.board_id,
  }));
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

  // 记录管理操作（可选：未来可以创建 moderation_logs 表）
  if (result.rowCount && result.rowCount > 0) {
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
export async function lockPost(postId: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE posts SET status = 1 WHERE id = $1 AND parent_id IS NULL RETURNING id`,
    [postId],
  );

  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * 管理功能：解锁主题
 */
export async function unlockPost(postId: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE posts SET status = 0 WHERE id = $1 AND parent_id IS NULL RETURNING id`,
    [postId],
  );

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
