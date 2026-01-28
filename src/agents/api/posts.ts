import type { Request, Response } from "express";
import {
  createPost,
  listPosts,
  getThreadById,
  getReplies,
  isThreadLocked,
  searchThreads,
  updatePost,
} from "../persistence/postgres";
import { checkCreatePost, validateReplyReferences } from "../guard/postGuard";
import { extractFirstUrl, fetchLinkPreview } from "../linkPreview";
import { createReport } from "../service/moderationService";
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
    const userAgent = getUserAgent(req);

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
      userAgent,
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

    // 驗證 >>N 引用（防止垃圾回覆）
    const refResult = validateReplyReferences(guardResult.content, thread.replyCount);
    if (!refResult.ok) {
      res.status(400).json({ error: refResult.error });
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

/**
 * PATCH /posts/:id
 * Edit a post using edit token (within 10 minutes of creation)
 */
export async function editPostHandler(req: Request, res: Response) {
  try {
    const postId = Number(req.params.id);
    const { editToken, content } = req.body;

    // Validate post ID
    if (!Number.isInteger(postId) || postId <= 0) {
      res.status(400).json({ error: "invalid post id" });
      return;
    }

    // Validate edit token
    if (!editToken || typeof editToken !== "string") {
      res.status(400).json({ error: "請提供編輯密碼" });
      return;
    }

    // Validate content
    if (!content || typeof content !== "string") {
      res.status(400).json({ error: "請提供內容" });
      return;
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      res.status(400).json({ error: "內容不能為空" });
      return;
    }

    if (trimmedContent.length > 10000) {
      res.status(400).json({ error: "內容過長（最多 10000 字元）" });
      return;
    }

    // Attempt to update the post
    const result = await updatePost({
      postId,
      editToken: editToken.trim(),
      content: trimmedContent,
    });

    if (!result.success) {
      // Determine appropriate status code
      const statusCode = result.error.includes("密碼") ? 403 :
                         result.error.includes("時限") ? 403 : 400;
      res.status(statusCode).json({ error: result.error });
      return;
    }

    // Success
    res.json(result.post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}

// Report rate limiting
const REPORT_COOLDOWN_MS = 12_000; // 12 seconds between reports (5 per minute max)
const reportRateLimitMap = new Map<string, number>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, time] of reportRateLimitMap) {
    if (now - time > REPORT_COOLDOWN_MS * 2) {
      reportRateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Valid report categories
const VALID_REPORT_CATEGORIES = [
  "hate_speech",
  "spam",
  "nsfw",
  "personal_attack",
  "illegal",
  "other",
];

/**
 * POST /posts/:id/report
 * User report for inappropriate content
 */
export async function reportPostHandler(req: Request, res: Response) {
  try {
    const postId = Number(req.params.id);

    // Validate post ID
    if (!Number.isInteger(postId) || postId <= 0) {
      res.status(400).json({ error: "invalid post id" });
      return;
    }

    const { category, text } = req.body;

    // Validate category
    if (!category || typeof category !== "string") {
      res.status(400).json({ error: "請選擇舉報類別" });
      return;
    }

    if (!VALID_REPORT_CATEGORIES.includes(category)) {
      res.status(400).json({
        error: "無效的舉報類別",
        validCategories: VALID_REPORT_CATEGORIES,
      });
      return;
    }

    // Validate optional text
    if (text !== undefined && typeof text !== "string") {
      res.status(400).json({ error: "補充說明必須是文字" });
      return;
    }

    const trimmedText = text?.trim();
    if (trimmedText && trimmedText.length > 500) {
      res.status(400).json({ error: "補充說明不能超過 500 字" });
      return;
    }

    // Rate limiting
    const realIp = getRealIp(req);
    const ipHash = getIpHash(realIp);
    const now = Date.now();
    const lastReport = reportRateLimitMap.get(ipHash);

    if (lastReport && now - lastReport < REPORT_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((REPORT_COOLDOWN_MS - (now - lastReport)) / 1000);
      res.status(429).json({
        error: `舉報冷卻中，請等待 ${waitSeconds} 秒`,
        retryAfter: waitSeconds,
      });
      return;
    }

    // Create report
    const result = await createReport(postId, ipHash, category, trimmedText);

    if (!result.success) {
      // Determine status code based on error
      const statusCode = result.error?.includes("不存在") ? 404 :
                         result.error?.includes("已經舉報") ? 409 : 400;
      res.status(statusCode).json({ error: result.error });
      return;
    }

    // Update rate limit on success
    reportRateLimitMap.set(ipHash, now);

    res.json({
      success: true,
      message: "舉報已送出，感謝您的回報",
    });
  } catch (err) {
    console.error("[REPORT] Error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}