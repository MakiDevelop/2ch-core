import type { Request, Response } from "express";
import {
  createPost,
  listPosts,
  getThreadById,
  getReplies,
} from "../persistence/postgres";
import { checkCreatePost } from "../guard/postGuard";
import crypto from "crypto";

function getIpHash(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.ip ?? "unknown";

  return crypto.createHash("sha256").update(ip).digest("hex");
}

/**
 * POST /posts
 * Anonymous post creation
 */
export async function createPostHandler(req: Request, res: Response) {
  try {
    const { content, parentId } = req.body;

    const ipHash = getIpHash(req);

    // parentId：僅允許一層 reply（必須指向 thread）
    let normalizedParentId: number | null = null;
    if (parentId !== undefined) {
      const parsedParentId = Number(parentId);
      if (!Number.isInteger(parsedParentId) || parsedParentId <= 0) {
        res.status(400).json({ error: "invalid parentId" });
        return;
      }
      normalizedParentId = parsedParentId;
    }

    // 1. Guard 檢查（最小防線）
    const guardResult = checkCreatePost({
      content,
      ipHash,
    });

    if (!guardResult.ok) {
      res.status(guardResult.status).json({ error: guardResult.error });
      return;
    }

    // 3. 呼叫你已經驗證成功的 persistence
    const post = await createPost({
      content: guardResult.content,
      ipHash,
      parentId: normalizedParentId,
    });

    // 4. 回傳結果
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * GET /posts
 * List latest posts
 */
export async function listPostsHandler(req: Request, res: Response) {
  try {
    const limitParam = req.query?.limit;
    const parsed = typeof limitParam === "string" ? Number(limitParam) : NaN;
    const limit = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 1), 50)
      : 20;

    const posts = await listPosts(limit);
    res.json({ items: posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * GET /posts/:id
 * Get thread detail with reply statistics
 */
export async function getThreadHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    // 验证 ID
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "invalid thread id" });
      return;
    }

    const thread = await getThreadById(id);

    if (!thread) {
      res.status(404).json({ error: "thread not found" });
      return;
    }

    res.json(thread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * GET /posts/:id/replies
 * Get all replies for a specific thread
 */
export async function getRepliesHandler(req: Request, res: Response) {
  try {
    const threadId = Number(req.params.id);

    // 验证 thread ID
    if (!Number.isInteger(threadId) || threadId <= 0) {
      res.status(400).json({ error: "invalid thread id" });
      return;
    }

    // 解析分页参数
    const limitParam = req.query?.limit;
    const offsetParam = req.query?.offset;

    const parsedLimit =
      typeof limitParam === "string" ? Number(limitParam) : NaN;
    const parsedOffset =
      typeof offsetParam === "string" ? Number(offsetParam) : NaN;

    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 50;
    const offset = Number.isFinite(parsedOffset)
      ? Math.max(parsedOffset, 0)
      : 0;

    // 先验证主题是否存在
    const thread = await getThreadById(threadId);
    if (!thread) {
      res.status(404).json({ error: "thread not found" });
      return;
    }

    // 获取回复列表
    const replies = await getReplies(threadId, limit, offset);

    res.json({
      thread: {
        id: thread.id,
        content: thread.content,
        createdAt: thread.createdAt,
        replyCount: thread.replyCount,
      },
      replies,
      pagination: {
        limit,
        offset,
        total: thread.replyCount,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}