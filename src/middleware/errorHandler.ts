/**
 * Global Error Handler Middleware
 *
 * Catches all unhandled errors and returns consistent JSON responses.
 * Must be registered as the LAST middleware in Express app.
 */

import type { Request, Response, NextFunction } from "express";
import { HttpError, TooManyRequestsError } from "../utils/errors";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log all errors
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

  // If not our custom HttpError, treat as internal server error
  if (!(err instanceof HttpError)) {
    console.error("[Unhandled Error] Stack:", err.stack);

    // In production, hide internal error details
    const message =
      process.env.NODE_ENV === "production"
        ? "internal server error"
        : err.message;

    res.status(500).json({ error: message });
    return;
  }

  // For operational errors, return the message
  // For non-operational (programming errors), hide details in production
  const message =
    err.isOperational || process.env.NODE_ENV !== "production"
      ? err.message
      : "internal server error";

  const body: Record<string, unknown> = { error: message };
  if (err.code) body.code = err.code;
  if (err instanceof TooManyRequestsError && err.retryAfter) {
    body.retryAfter = err.retryAfter;
  }

  res.status(err.statusCode).json(body);
}

/**
 * 404 Handler - catches requests that don't match any route
 * Must be registered AFTER all routes but BEFORE errorHandler
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
}
