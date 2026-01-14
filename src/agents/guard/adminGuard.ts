/**
 * Admin Guard
 * 管理员权限检查
 *
 * 认证方式（优先级从高到低）：
 * 1. Bearer Token (ADMIN_API_TOKEN) - 推荐
 * 2. IP Hash 白名单 (ADMIN_IP_HASHES) - 已弃用，仅作为后备
 */

import crypto from "crypto";

type AdminGuardResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/**
 * 检查 Bearer Token 认证
 */
export function checkAdminToken(authHeader: string | undefined): AdminGuardResult {
  const adminToken = process.env.ADMIN_API_TOKEN;

  // If no token configured, skip token auth
  if (!adminToken || adminToken.trim() === "") {
    return {
      ok: false,
      status: 401,
      error: "token_not_configured",
    };
  }

  // Check Authorization header
  if (!authHeader) {
    return {
      ok: false,
      status: 401,
      error: "authorization header required",
    };
  }

  // Parse Bearer token
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return {
      ok: false,
      status: 401,
      error: "invalid authorization format (expected: Bearer <token>)",
    };
  }

  const providedToken = match[1];

  // Use timing-safe comparison to prevent timing attacks
  const tokenBuffer = Buffer.from(adminToken);
  const providedBuffer = Buffer.from(providedToken);

  if (tokenBuffer.length !== providedBuffer.length) {
    return {
      ok: false,
      status: 403,
      error: "invalid admin token",
    };
  }

  if (!crypto.timingSafeEqual(tokenBuffer, providedBuffer)) {
    return {
      ok: false,
      status: 403,
      error: "invalid admin token",
    };
  }

  return { ok: true };
}

/**
 * 检查是否为管理员（IP Hash - 已弃用）
 */
export function checkIsAdmin(ipHash: string): AdminGuardResult {
  const adminHashes = process.env.ADMIN_IP_HASHES;

  if (!adminHashes || adminHashes.trim() === "") {
    return {
      ok: false,
      status: 503,
      error: "admin system not configured",
    };
  }

  const allowedHashes = adminHashes.split(",").map((h) => h.trim()).filter(h => h);

  if (allowedHashes.length === 0 || !allowedHashes.includes(ipHash)) {
    return {
      ok: false,
      status: 403,
      error: "forbidden: admin access required",
    };
  }

  return { ok: true };
}

/**
 * 综合认证检查
 * SECURITY FIX: Removed fallback to IP Hash - Bearer Token is now mandatory
 */
export function checkAdminAuth(
  authHeader: string | undefined,
  ipHash: string
): AdminGuardResult {
  // SECURITY: Always require Bearer token authentication
  const tokenResult = checkAdminToken(authHeader);
  if (tokenResult.ok) {
    return tokenResult;
  }

  // SECURITY FIX: No longer fall back to IP hash authentication
  // If token not configured, return error instead of downgrading
  if (tokenResult.error === "token_not_configured") {
    return {
      ok: false,
      status: 503,
      error: "Admin authentication not configured. Please set ADMIN_API_TOKEN in production environment.",
    };
  }

  // Token was provided but invalid
  return tokenResult;
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
