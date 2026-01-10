import type { Request, Response } from "express";
import {
  listBoards,
  getBoardBySlug,
  getBoardThreads,
  createPost,
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
    const { content } = req.body;

    // 验证板块是否存在
    const board = await getBoardBySlug(slug);
    if (!board) {
      res.status(404).json({ error: "board not found" });
      return;
    }

    const ipHash = getIpHash(req);

    // Guard 检查
    const guardResult = checkCreatePost({
      content,
      ipHash,
    });

    if (!guardResult.ok) {
      res.status(guardResult.status).json({ error: guardResult.error });
      return;
    }

    // 创建主题（parentId = null，指定 boardId）
    const thread = await createPost({
      content: guardResult.content,
      ipHash,
      parentId: null,
      boardId: board.id,
    });

    res.status(201).json(thread);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}
