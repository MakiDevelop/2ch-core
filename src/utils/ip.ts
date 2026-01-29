/**
 * IP Utilities
 *
 * Shared functions for IP address handling and hashing.
 * Used across API handlers for rate limiting and logging.
 */

import crypto from "crypto";
import type { Request } from "express";
import env from "../config/env";

/**
 * Get the real client IP address from request.
 * With trust proxy enabled, req.ip uses X-Forwarded-For set by nginx.
 * Nginx overwrites X-Forwarded-For with $remote_addr to prevent spoofing.
 */
export function getRealIp(req: Request): string {
  return req.ip ?? "unknown";
}

/**
 * Hash an IP address using HMAC-SHA256.
 * Uses APP_SECRET to prevent rainbow table attacks on IPv4 space.
 */
export function hashIp(ip: string): string {
  return crypto.createHmac("sha256", env.APP_SECRET).update(ip).digest("hex");
}

/**
 * Get the hashed IP directly from request.
 * Convenience function combining getRealIp and hashIp.
 */
export function getIpHash(req: Request): string {
  return hashIp(getRealIp(req));
}

/**
 * Get User-Agent header from request.
 */
export function getUserAgent(req: Request): string {
  return req.headers["user-agent"] || "unknown";
}
