import type { Request, Response } from "express";
import {
  listBoards,
  getBoardBySlug,
  getBoardThreads,
  createPost,
} from "../persistence/postgres";
import { checkCreatePost } from "../guard/postGuard";
import { extractFirstUrl, fetchLinkPreview } from "../linkPreview";
import crypto from "crypto";

function getRealIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.ip ?? "unknown";

  return ip;
}

function getIpHash(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

function getUserAgent(req: Request): string {
  return req.headers["user-agent"] || "unknown";
}

/**
 * GET /boards
 * List all boards
 */
export async function listBoardsHandler(req: Request, res: Response) {
  try {
    const boards = await listBoards();
    res.json({ items: boards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * GET /boards/:slug/threads
 * List threads in a specific board
 */
export async function getBoardThreadsHandler(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    // 验证板块是否存在
    const board = await getBoardBySlug(slug);
    if (!board) {
      res.status(404).json({ error: "board not found" });
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
      ? Math.min(Math.max(parsedLimit, 1), 50)
      : 30;
    const offset = Number.isFinite(parsedOffset)
      ? Math.max(parsedOffset, 0)
      : 0;

    // 获取主题列表
    const threads = await getBoardThreads(board.id, limit, offset);

    res.json({
      board: {
        slug: board.slug,
        name: board.name,
        description: board.description,
        threadCount: board.threadCount,
      },
      threads,
      pagination: {
        limit,
        offset,
        total: board.threadCount ?? 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * POST /boards/:slug/threads
 * Create a new thread in a specific board
 */
export async function createBoardThreadHandler(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const { content, title, authorName } = req.body;

    // 验证板块是否存在
    const board = await getBoardBySlug(slug);
    if (!board) {
      res.status(404).json({ error: "board not found" });
      return;
    }

    // 驗證標題
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({ error: "標題為必填" });
      return;
    }

    if (title.length > 80) {
      res.status(400).json({ error: "標題長度不得超過 80 字" });
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

    // 创建主题（parentId = null，指定 boardId）
    const thread = await createPost({
      content: guardResult.content,
      ipHash,
      realIp,
      userAgent,
      parentId: null,
      boardId: board.id,
      title: title.trim(),
      authorName: authorName?.trim() || "名無しさん",
      linkPreview,
    });

    res.status(201).json(thread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}
