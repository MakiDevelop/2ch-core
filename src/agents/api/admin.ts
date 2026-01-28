import type { Request, Response } from "express";
import {
  deletePost,
  lockPost,
  unlockPost,
  deletePostsByIpHash,
  getSystemStats,
  listThreads,
  listThreadsByLastReply,
} from "../persistence/postgres";
import { checkAdminAuth, checkDeleteReason } from "../guard/adminGuard";
import {
  scanUnscannedPosts,
  getModerationQueue,
  getQueueCount,
  approvePost,
  rejectPost,
  getModerationStats,
} from "../service/moderationService";
import {
  listCategories,
  listBadwords,
  createBadword,
  updateBadword,
  deleteBadword,
  updateCategoryWeight,
  getBadwordStats,
  importFromConfig,
} from "../service/badwordService";
import crypto from "crypto";
import os from "os";
import Docker from "dockerode";

// SECURITY FIX: Replaced shell exec with Docker SDK to prevent command injection
const docker = new Docker();

function getRealIp(req: Request): string {
  // With trust proxy enabled, req.ip is set from X-Forwarded-For by Express
  // Nginx overwrites X-Forwarded-For with $remote_addr to prevent spoofing
  return req.ip ?? "unknown";
}

function getIpHash(req: Request): string {
  const ip = getRealIp(req);
  // Use HMAC with server secret to prevent rainbow table attacks on IPv4
  const secret = process.env.APP_SECRET || "default-secret-change-me";
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}

/**
 * POST /admin/posts/:id/delete
 * 删除主题或回复（软删除）
 */
export async function deletePostHandler(req: Request, res: Response) {
  try {
    const postId = Number(req.params.id);
    const { reason } = req.body;

    // 验证 ID
    if (!Number.isInteger(postId) || postId <= 0) {
      res.status(400).json({ error: "invalid post id" });
      return;
    }

    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    // 检查管理员权限 (Bearer Token 优先，IP Hash 后备)
    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    // 验证删除理由
    const reasonCheck = checkDeleteReason(reason);
    if (!reasonCheck.ok) {
      res.status(reasonCheck.status).json({ error: reasonCheck.error });
      return;
    }

    // 执行删除
    const success = await deletePost(postId, reason, ipHash);

    if (!success) {
      res.status(404).json({ error: "post not found" });
      return;
    }

    res.json({
      success: true,
      postId,
      action: "deleted",
      reason,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * POST /admin/posts/:id/lock
 * 锁定主题（禁止回复）
 */
export async function lockPostHandler(req: Request, res: Response) {
  try {
    const postId = Number(req.params.id);

    // 验证 ID
    if (!Number.isInteger(postId) || postId <= 0) {
      res.status(400).json({ error: "invalid post id" });
      return;
    }

    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    // 检查管理员权限 (Bearer Token 优先，IP Hash 后备)
    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    // 执行锁定
    const success = await lockPost(postId, ipHash);

    if (!success) {
      res.status(404).json({ error: "thread not found or already locked" });
      return;
    }

    res.json({
      success: true,
      postId,
      action: "locked",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * POST /admin/posts/:id/unlock
 * 解锁主题
 */
export async function unlockPostHandler(req: Request, res: Response) {
  try {
    const postId = Number(req.params.id);

    // 验证 ID
    if (!Number.isInteger(postId) || postId <= 0) {
      res.status(400).json({ error: "invalid post id" });
      return;
    }

    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    // 检查管理员权限 (Bearer Token 优先，IP Hash 后备)
    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    // 执行解锁
    const success = await unlockPost(postId, ipHash);

    if (!success) {
      res.status(404).json({ error: "thread not found or not locked" });
      return;
    }

    res.json({
      success: true,
      postId,
      action: "unlocked",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * POST /admin/moderation/by-ip
 * 按 IP Hash 批量操作
 */
export async function moderateByIpHandler(req: Request, res: Response) {
  try {
    const { ipHash: targetIpHash, action, reason } = req.body;

    // 验证参数
    if (!targetIpHash || typeof targetIpHash !== "string") {
      res.status(400).json({ error: "ipHash is required" });
      return;
    }

    if (action !== "delete_all") {
      res
        .status(400)
        .json({ error: 'invalid action (supported: "delete_all")' });
      return;
    }

    const adminIpHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    // 检查管理员权限 (Bearer Token 优先，IP Hash 后备)
    const adminCheck = checkAdminAuth(authHeader, adminIpHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    // 验证删除理由
    const reasonCheck = checkDeleteReason(reason);
    if (!reasonCheck.ok) {
      res.status(reasonCheck.status).json({ error: reasonCheck.error });
      return;
    }

    // 执行批量删除
    const count = await deletePostsByIpHash(
      targetIpHash,
      reason,
      adminIpHash,
    );

    res.json({
      success: true,
      action: "delete_all",
      targetIpHash,
      affectedCount: count,
      reason,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * GET /admin/system-status
 * 系統健康檢查 - 顯示系統負載、容器狀態等資訊
 */
export async function systemStatusHandler(req: Request, res: Response) {
  try {
    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    // 檢查管理員權限 (Bearer Token 优先，IP Hash 后备)
    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    // 收集系統資訊
    const systemInfo = {
      timestamp: new Date().toISOString(),
      system: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        uptimeFormatted: formatUptime(os.uptime()),
        loadavg: os.loadavg(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        usedMemory: os.totalmem() - os.freemem(),
        memoryUsagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2),
      },
      process: {
        nodeVersion: process.version,
        pid: process.pid,
        uptime: process.uptime(),
        uptimeFormatted: formatUptime(process.uptime()),
        memoryUsage: process.memoryUsage(),
      },
      database: await getSystemStats(),
      containers: await getContainerStatus(),
    };

    res.json(systemInfo);
  } catch (err) {
    console.error("[SYSTEM-STATUS] Error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * 格式化 uptime 為人類可讀格式
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}

/**
 * 獲取容器狀態
 * SECURITY FIX: Using Docker SDK instead of shell exec to prevent command injection
 */
async function getContainerStatus(): Promise<any> {
  try {
    // Use Docker SDK to list containers with name filter
    const containers = await docker.listContainers({
      all: false, // Only running containers
      filters: {
        name: ['2ch-core']
      }
    });

    return {
      count: containers.length,
      containers: containers.map(container => ({
        name: container.Names[0]?.replace(/^\//, '') || 'unknown', // Remove leading slash
        status: container.Status,
        state: container.State,
        created: container.Created,
        image: container.Image
      }))
    };
  } catch (error) {
    console.error('[DOCKER-STATUS] Error:', error);
    return {
      error: "Docker not available or no permission",
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * GET /admin/threads
 * 列出最新討論串（僅管理員可用）
 */
export async function listThreadsHandler(req: Request, res: Response) {
  try {
    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    // 檢查管理員權限
    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const limitParam = req.query?.limit;
    const parsed = typeof limitParam === "string" ? Number(limitParam) : NaN;
    const limit = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 1), 100)
      : 10;

    const threads = await listThreads(limit);
    res.json({ items: threads });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * GET /admin/threads/by-last-reply
 * 列出最近有回覆的討論串（僅管理員可用）
 */
export async function listThreadsByLastReplyHandler(req: Request, res: Response) {
  try {
    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    // 檢查管理員權限
    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const limitParam = req.query?.limit;
    const parsed = typeof limitParam === "string" ? Number(limitParam) : NaN;
    const limit = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 1), 100)
      : 10;

    const threads = await listThreadsByLastReply(limit);
    res.json({ items: threads });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal server error" });
  }
}

// ============================================
// Content Moderation API
// ============================================

/**
 * GET /admin/moderation/queue
 * 取得審核佇列
 */
export async function moderationQueueHandler(req: Request, res: Response) {
  try {
    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const limitParam = req.query?.limit;
    const offsetParam = req.query?.offset;

    const limit = typeof limitParam === "string" ? Math.min(Math.max(Number(limitParam) || 20, 1), 100) : 20;
    const offset = typeof offsetParam === "string" ? Math.max(Number(offsetParam) || 0, 0) : 0;

    const [items, total] = await Promise.all([
      getModerationQueue(limit, offset),
      getQueueCount(),
    ]);

    res.json({
      items,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + items.length < total,
      },
    });
  } catch (err) {
    console.error("[MODERATION] Queue error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * GET /admin/moderation/stats
 * 取得審核統計
 */
export async function moderationStatsHandler(req: Request, res: Response) {
  try {
    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const stats = await getModerationStats();
    res.json(stats);
  } catch (err) {
    console.error("[MODERATION] Stats error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * POST /admin/moderation/scan
 * 觸發批次掃描
 */
export async function triggerScanHandler(req: Request, res: Response) {
  try {
    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const limitParam = req.body?.limit;
    const limit = typeof limitParam === "number" ? Math.min(Math.max(limitParam, 1), 1000) : 100;

    console.log(`[MODERATION] Scan triggered by admin, limit: ${limit}`);
    const result = await scanUnscannedPosts(limit);

    res.json({
      success: true,
      result,
    });
  } catch (err) {
    console.error("[MODERATION] Scan error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * POST /admin/moderation/posts/:id/approve
 * 審核通過
 */
export async function approvePostHandler(req: Request, res: Response) {
  try {
    const postId = Number(req.params.id);

    if (!Number.isInteger(postId) || postId <= 0) {
      res.status(400).json({ error: "invalid post id" });
      return;
    }

    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const success = await approvePost(postId, ipHash);

    if (!success) {
      res.status(404).json({ error: "post not found or not in review queue" });
      return;
    }

    res.json({
      success: true,
      postId,
      action: "approved",
    });
  } catch (err) {
    console.error("[MODERATION] Approve error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * POST /admin/moderation/posts/:id/reject
 * 審核拒絕（刪除）
 */
export async function rejectPostHandler(req: Request, res: Response) {
  try {
    const postId = Number(req.params.id);
    const { reason } = req.body;

    if (!Number.isInteger(postId) || postId <= 0) {
      res.status(400).json({ error: "invalid post id" });
      return;
    }

    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const success = await rejectPost(postId, ipHash, reason);

    if (!success) {
      res.status(404).json({ error: "post not found or not in review queue" });
      return;
    }

    res.json({
      success: true,
      postId,
      action: "rejected",
      reason: reason || null,
    });
  } catch (err) {
    console.error("[MODERATION] Reject error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}

// ============================================
// Badword Management API
// ============================================

/**
 * GET /admin/badwords/categories
 * 列出所有關鍵字類別
 */
export async function listBadwordCategoriesHandler(req: Request, res: Response) {
  try {
    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const categories = await listCategories();
    res.json({ items: categories });
  } catch (err) {
    console.error("[BADWORD] List categories error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * PUT /admin/badwords/categories/:id
 * 更新類別權重
 */
export async function updateBadwordCategoryHandler(req: Request, res: Response) {
  try {
    const categoryId = Number(req.params.id);
    const { weight } = req.body;

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      res.status(400).json({ error: "invalid category id" });
      return;
    }

    if (typeof weight !== "number" || weight < 0 || weight > 1) {
      res.status(400).json({ error: "weight must be a number between 0 and 1" });
      return;
    }

    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const success = await updateCategoryWeight(categoryId, weight);

    if (!success) {
      res.status(404).json({ error: "category not found" });
      return;
    }

    res.json({ success: true, categoryId, weight });
  } catch (err) {
    console.error("[BADWORD] Update category error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * GET /admin/badwords
 * 列出關鍵字（支援分頁和篩選）
 */
export async function listBadwordsHandler(req: Request, res: Response) {
  try {
    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const categoryId = req.query.categoryId
      ? Number(req.query.categoryId)
      : undefined;
    const search = req.query.search as string | undefined;
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const result = await listBadwords({ categoryId, search, limit, offset });

    res.json({
      items: result.items,
      pagination: {
        limit,
        offset,
        total: result.total,
        hasMore: offset + result.items.length < result.total,
      },
    });
  } catch (err) {
    console.error("[BADWORD] List error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * POST /admin/badwords
 * 新增關鍵字
 */
export async function createBadwordHandler(req: Request, res: Response) {
  try {
    const { categoryId, term, pattern } = req.body;

    if (!categoryId || !Number.isInteger(categoryId)) {
      res.status(400).json({ error: "categoryId is required" });
      return;
    }

    if (!term && !pattern) {
      res.status(400).json({ error: "term or pattern is required" });
      return;
    }

    if (term && pattern) {
      res.status(400).json({ error: "cannot have both term and pattern" });
      return;
    }

    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const result = await createBadword({
      categoryId,
      term: term?.trim(),
      pattern: pattern?.trim(),
      createdBy: ipHash,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json({ success: true, badword: result.badword });
  } catch (err) {
    console.error("[BADWORD] Create error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * PUT /admin/badwords/:id
 * 更新關鍵字
 */
export async function updateBadwordHandler(req: Request, res: Response) {
  try {
    const badwordId = Number(req.params.id);

    if (!Number.isInteger(badwordId) || badwordId <= 0) {
      res.status(400).json({ error: "invalid badword id" });
      return;
    }

    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const { term, pattern, isActive } = req.body;

    const result = await updateBadword(badwordId, {
      term: term?.trim(),
      pattern: pattern?.trim(),
      isActive,
    });

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ success: true, badwordId });
  } catch (err) {
    console.error("[BADWORD] Update error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * DELETE /admin/badwords/:id
 * 刪除關鍵字
 */
export async function deleteBadwordHandler(req: Request, res: Response) {
  try {
    const badwordId = Number(req.params.id);

    if (!Number.isInteger(badwordId) || badwordId <= 0) {
      res.status(400).json({ error: "invalid badword id" });
      return;
    }

    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const success = await deleteBadword(badwordId);

    if (!success) {
      res.status(404).json({ error: "badword not found" });
      return;
    }

    res.json({ success: true, badwordId });
  } catch (err) {
    console.error("[BADWORD] Delete error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * GET /admin/badwords/stats
 * 取得關鍵字統計
 */
export async function badwordStatsHandler(req: Request, res: Response) {
  try {
    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const stats = await getBadwordStats();
    res.json(stats);
  } catch (err) {
    console.error("[BADWORD] Stats error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}

/**
 * POST /admin/badwords/import
 * 從 JSON 匯入關鍵字
 */
export async function importBadwordsHandler(req: Request, res: Response) {
  try {
    const ipHash = getIpHash(req);
    const authHeader = req.headers.authorization;

    const adminCheck = checkAdminAuth(authHeader, ipHash);
    if (!adminCheck.ok) {
      res.status(adminCheck.status).json({ error: adminCheck.error });
      return;
    }

    const config = req.body;

    if (!config || typeof config !== "object") {
      res.status(400).json({ error: "invalid config format" });
      return;
    }

    const result = await importFromConfig(config, ipHash);

    res.json({
      success: true,
      imported: result.imported,
      errors: result.errors,
    });
  } catch (err) {
    console.error("[BADWORD] Import error:", err);
    res.status(500).json({ error: "internal server error" });
  }
}
