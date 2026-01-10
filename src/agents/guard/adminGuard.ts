/**
 * Admin Guard
 * 管理员权限检查
 *
 * 权限检查方式：IP Hash 白名单
 * 配置方式：环境变量 ADMIN_IP_HASHES (逗号分隔)
 */

type AdminGuardResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * 检查是否为管理员
 */
export function checkIsAdmin(ipHash: string): AdminGuardResult {
  const adminHashes = process.env.ADMIN_IP_HASHES;

  if (!adminHashes) {
    return {
      ok: false,
      status: 503,
      error: "admin system not configured",
    };
  }

  const allowedHashes = adminHashes.split(",").map((h) => h.trim());

  if (!allowedHashes.includes(ipHash)) {
    return {
      ok: false,
      status: 403,
      error: "forbidden: admin access required",
    };
  }

  return { ok: true };
}

/**
 * 验证删除理由
 */
export function checkDeleteReason(reason?: string): AdminGuardResult {
  if (!reason || typeof reason !== "string") {
    return {
      ok: false,
      status: 400,
      error: "reason is required",
    };
  }

  const normalized = reason.trim();

  if (normalized.length === 0) {
    return {
      ok: false,
      status: 400,
      error: "reason cannot be empty",
    };
  }

  if (normalized.length > 200) {
    return {
      ok: false,
      status: 400,
      error: "reason too long (max 200 characters)",
    };
  }

  return { ok: true };
}
