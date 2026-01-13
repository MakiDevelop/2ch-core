import type { Request, Response } from "express";
import {
  deletePost,
  lockPost,
  unlockPost,
  deletePostsByIpHash,
  getSystemStats,
} from "../persistence/postgres";
import { checkIsAdmin, checkDeleteReason } from "../guard/adminGuard";
import crypto from "crypto";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

function getIpHash(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.ip ?? "unknown";

  return crypto.createHash("sha256").update(ip).digest("hex");
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

    // 检查管理员权限
    const adminCheck = checkIsAdmin(ipHash);
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

    // 检查管理员权限
    const adminCheck = checkIsAdmin(ipHash);
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

    // 检查管理员权限
    const adminCheck = checkIsAdmin(ipHash);
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

    // 检查管理员权限
    const adminCheck = checkIsAdmin(adminIpHash);
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

    // 檢查管理員權限
    const adminCheck = checkIsAdmin(ipHash);
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
 */
async function getContainerStatus(): Promise<any> {
  try {
    const { stdout } = await execAsync(
      'docker ps --format "{{.Names}}|{{.Status}}|{{.State}}" --filter "name=2ch-core" || echo "docker_unavailable"'
    );

    if (stdout.includes("docker_unavailable")) {
      return { error: "Docker not available or no permission" };
    }

    const lines = stdout.trim().split("\n").filter(line => line);
    const containers = lines.map(line => {
      const [name, status, state] = line.split("|");
      return { name, status, state };
    });

    return {
      count: containers.length,
      containers,
    };
  } catch (error) {
    return { error: "Failed to get container status" };
  }
}
