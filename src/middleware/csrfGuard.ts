/**
 * CSRF Protection Middleware
 *
 * Validates Origin/Referer headers on state-changing requests (POST/PUT/PATCH/DELETE).
 * Requests with valid Bearer token (admin API) bypass this check.
 *
 * This prevents cross-site request forgery where a malicious site tricks
 * a user's browser into making unwanted requests to 2ch.tw.
 */

import { Request, Response, NextFunction } from "express";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Allowed origins (production, dev, local)
const ALLOWED_ORIGINS = new Set([
  "https://2ch.tw",
  "https://dev.2ch.tw",
  "http://localhost:3000",
  "http://localhost",
]);

/**
 * Extract origin from Origin header or Referer header
 */
function getRequestOrigin(req: Request): string | null {
  // Prefer Origin header (set by browsers on cross-origin and same-origin POST)
  const origin = req.headers.origin;
  if (origin) return origin;

  // Fallback to Referer header
  const referer = req.headers.referer;
  if (referer) {
    try {
      const url = new URL(referer);
      return url.origin;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * CSRF guard middleware
 * Blocks state-changing requests from unknown origins.
 */
export function csrfGuard(req: Request, res: Response, next: NextFunction): void {
  // Only check state-changing methods
  if (!STATE_CHANGING_METHODS.has(req.method)) {
    next();
    return;
  }

  // Skip check for requests with Bearer token (admin API has its own auth)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const origin = getRequestOrigin(req);

  // If no Origin/Referer header: allow (some legitimate clients don't send them,
  // e.g. curl, mobile apps, same-origin form submissions in older browsers).
  // The risk is low because attackers can't suppress these headers from browsers.
  if (!origin) {
    next();
    return;
  }

  if (ALLOWED_ORIGINS.has(origin)) {
    next();
    return;
  }

  // Block: unknown origin
  console.warn(`[CSRF] Blocked request from origin: ${origin}, path: ${req.path}, method: ${req.method}`);
  res.status(403).json({ error: "forbidden: invalid request origin" });
}
