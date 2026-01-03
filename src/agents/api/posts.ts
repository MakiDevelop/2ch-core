import type { Request, Response } from "express";
import { createPost, listPosts } from "../persistence/postgres";
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