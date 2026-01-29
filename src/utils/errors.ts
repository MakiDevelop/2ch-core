/**
 * Custom Error Classes for Unified Error Handling
 *
 * Usage:
 *   throw new BadRequestError("Invalid input");
 *   throw new NotFoundError("Post not found");
 *   throw new UnauthorizedError("Invalid token");
 */

export class HttpError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 4xx Client Errors
export class BadRequestError extends HttpError {
  constructor(message = "Bad Request") {
    super(400, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Not Found") {
    super(404, message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Conflict") {
    super(409, message);
  }
}

export class TooManyRequestsError extends HttpError {
  retryAfter?: number;

  constructor(message = "Too Many Requests", retryAfter?: number) {
    super(429, message);
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
