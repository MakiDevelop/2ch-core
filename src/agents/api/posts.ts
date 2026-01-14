import type { Request, Response } from "express";
import {
  createPost,
  listPosts,
  getThreadById,
  getReplies,
  isThreadLocked,
  searchThreads,
} from "../persistence/postgres";
import { checkCreatePost } from "../guard/postGuard";
import { extractFirstUrl, fetchLinkPreview } from "../linkPreview";
import crypto from "crypto";

function getRealIp(req: Request): string {
  // With trust proxy enabled, req.ip is set from X-Forwarded-For by Express
  // Nginx overwrites X-Forwarded-For with $remote_addr to prevent spoofing
  return req.ip ?? "unknown";
}

function getIpHash(ip: string): string {
  // Use HMAC with server secret to prevent rainbow table attacks on IPv4
  const secret = process.env.APP_SECRET || "default-secret-change-me";
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

function getUserAgent(req: Request): string {
  return req.headers["user-agent"] || "unknown";
}

/**
 * POST /posts
 * Anonymous post creation
 */
export async function createPostHandler(req: Request, res: Response) {
  try {
    const { content, parentId } = req.body;

    const realIp = getRealIp(req);
    const ipHash = getIpHash(realIp);

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
 * POST /posts/:id/replies
 * Create a reply to a thread
 */
export async function createReplyHandler(req: Request, res: Response) {
  try {
    const threadId = Number(req.params.id);
    const { content, authorName } = req.body;

    // 验证 thread ID
    if (!Number.isInteger(threadId) || threadId <= 0) {
      res.status(400).json({ error: "invalid thread id" });
      return;
    }

    // 先验证主题是否存在
    const thread = await getThreadById(threadId);
    if (!thread) {
      res.status(404).json({ error: "thread not found" });
      return;
    }

    // 檢查是否已達 999 樓上限
    if (thread.replyCount >= 999) {
      res.status(403).json({ error: "此討論串已達 999 樓上限，已封存無法回覆" });
      return;
    }

    // 檢查討論串是否已被鎖定
    const locked = await isThreadLocked(threadId);
    if (locked) {
      res.status(403).json({ error: "此討論串已被鎖定，無法回覆" });
      return;
    }

    const realIp = getRealIp(req);
    const ipHash = getIpHash(realIp);
    const userAgent = getUserAgent(req);

    // Guard 检查
    const guardResult = checkCreatePost({
      content,
      ipHash,
    });

    if (!guardResult.ok) {
      res.status(guardResult.status).json({ error: guardResult.error });
      return;
    }

    // 嘗試解析第一個 URL 的 link preview（不阻塞，3秒 timeout）
    let linkPreview = null;
    const firstUrl = extractFirstUrl(guardResult.content);
    if (firstUrl) {
      try {
        linkPreview = await fetchLinkPreview(firstUrl);
      } catch (err) {
        // 解析失敗就忽略，保持 auto-link
        console.log('[LinkPreview] Failed to fetch:', firstUrl);
      }
    }

    // 创建回复（指定 parentId）
    const reply = await createPost({
      content: guardResult.content,
      ipHash,
      realIp,
      userAgent,
      parentId: threadId,
      boardId: thread.boardId ?? null,
      authorName: authorName?.trim() || "名無しさん",
      linkPreview,
    });

    res.status(201).json(reply);
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

// Rate limit map for search: ipHash -> lastSearchTime
const searchRateLimitMap = new Map<string, number>();
const SEARCH_COOLDOWN_MS = 10 * 1000; // 10 seconds

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, time] of searchRateLimitMap) {
    if (now - time > SEARCH_COOLDOWN_MS * 2) {
      searchRateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * GET /search?q=keyword
 * Search threads by title and content
 */
export async function searchHandler(req: Request, res: Response) {
  try {
    const query = req.query.q;

    // Validate query
    if (!query || typeof query !== "string") {
      res.status(400).json({ error: "搜尋關鍵字為必填" });
      return;
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      res.status(400).json({ error: "搜尋關鍵字至少需要 2 個字元" });
      return;
    }

    if (trimmedQuery.length > 50) {
      res.status(400).json({ error: "搜尋關鍵字不能超過 50 個字元" });
      return;
    }

    // Rate limiting by IP
    const realIp = getRealIp(req);
    const ipHash = getIpHash(realIp);
    const now = Date.now();
    const lastSearch = searchRateLimitMap.get(ipHash);

    if (lastSearch && now - lastSearch < SEARCH_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((SEARCH_COOLDOWN_MS - (now - lastSearch)) / 1000);
      res.status(429).json({
        error: `搜尋冷卻中，請等待 ${waitSeconds} 秒`,
        retryAfter: waitSeconds,
      });
      return;
    }

    // Update rate limit
    searchRateLimitMap.set(ipHash, now);

    // Parse limit
    const limitParam = req.query?.limit;
    const parsed = typeof limitParam === "string" ? Number(limitParam) : NaN;
    const limit = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 1), 30)
      : 20;

    // Execute search
    const results = await searchThreads(trimmedQuery, limit);

    res.json({
      query: trimmedQuery,
      count: results.length,
      items: results.map((thread) => ({
        id: thread.id,
        title: thread.title,
        content: thread.content?.substring(0, 200) + (thread.content && thread.content.length > 200 ? "..." : ""),
        authorName: thread.authorName,
        boardSlug: thread.boardSlug,
        boardName: thread.boardName,
        replyCount: thread.replyCount,
        createdAt: thread.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}