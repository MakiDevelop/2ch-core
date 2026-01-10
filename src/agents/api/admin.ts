import type { Request, Response } from "express";
import {
  deletePost,
  lockPost,
  unlockPost,
  deletePostsByIpHash,
} from "../persistence/postgres";
import { checkIsAdmin, checkDeleteReason } from "../guard/adminGuard";
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
    const success = await lockPost(postId);

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
    const success = await unlockPost(postId);

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
