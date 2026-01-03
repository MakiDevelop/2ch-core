import { Pool } from "pg";

export type Post = {
  id: number;
  content: string;
  status: number;
  ipHash: string;
  createdAt: Date;
  parentId: number | null;
};

export type CreatePostParams = {
  content: string;
  status?: number;
  ipHash: string;
  parentId?: number | null;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function createPost(params: CreatePostParams): Promise<Post> {
  const { content, status, ipHash, parentId } = params;

  if (status === undefined) {
    const result = await pool.query(
      "INSERT INTO posts (content, ip_hash, parent_id) VALUES ($1, $2, $3) RETURNING id, content, status, ip_hash, created_at, parent_id",
      [content, ipHash, parentId ?? null],
    );
    const row = result.rows[0];
    return {
      id: row.id,
      content: row.content,
      status: row.status,
      ipHash: row.ip_hash,
      createdAt: row.created_at,
      parentId: row.parent_id,
    };
  }

  const result = await pool.query(
    "INSERT INTO posts (content, status, ip_hash, parent_id) VALUES ($1, $2, $3, $4) RETURNING id, content, status, ip_hash, created_at, parent_id",
    [content, status, ipHash, parentId ?? null],
  );
  const row = result.rows[0];
  return {
    id: row.id,
    content: row.content,
    status: row.status,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
    parentId: row.parent_id,
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
