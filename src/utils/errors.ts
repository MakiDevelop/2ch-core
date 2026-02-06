/**
 * Custom Error Classes for Unified Error Handling
 *
 * Usage:
 *   throw new BadRequestError("Invalid input");
 *   throw new NotFoundError("Post not found");
 *   throw new UnauthorizedError("Invalid token");
 *
 * With error code:
 *   throw new BadRequestError("content too long", "CONTENT_TOO_LONG");
 */

export class HttpError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;

  constructor(statusCode: number, message: string, isOperational = true, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 4xx Client Errors
export class BadRequestError extends HttpError {
  constructor(message = "Bad Request", code?: string) {
    super(400, message, true, code);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized", code?: string) {
    super(401, message, true, code);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden", code?: string) {
    super(403, message, true, code);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Not Found", code?: string) {
    super(404, message, true, code);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Conflict", code?: string) {
    super(409, message, true, code);
  }
}

export class TooManyRequestsError extends HttpError {
  retryAfter?: number;

  constructor(message = "Too Many Requests", retryAfter?: number, code?: string) {
    super(429, message, true, code);
    this.retryAfter = retryAfter;
  }
}

// 5xx Server Errors
export class InternalServerError extends HttpError {
  constructor(message = "Internal Server Error", originalError?: Error) {
    super(500, message, false);
    if (originalError) {
      console.error("[InternalServerError] Original error:", originalError);
    }
  }
}

export class DatabaseError extends InternalServerError {
  constructor(message = "Database operation failed", originalError?: Error) {
    super(message, originalError);
    this.name = "DatabaseError";
  }
}
