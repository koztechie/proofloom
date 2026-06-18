/**
 * lib/api/errors.ts
 *
 * Application-level typed error hierarchy.
 *
 * All errors carry:
 *   - statusCode  → HTTP status to return to the client
 *   - code        → machine-readable snake_case identifier
 *   - message     → human-readable description (safe to expose)
 *   - details     → optional structured payload (Zod issues, field hints…)
 *
 * Usage in route handlers:
 *   throw new ValidationError("Invalid input.", issues);
 *   throw new NotFoundError("Challenge not found.");
 *
 * The withApiErrorHandler wrapper catches these and converts them via toJSON().
 */

// ---------------------------------------------------------------------------
// Serialised shape shared by all error classes
// ---------------------------------------------------------------------------
export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

// ---------------------------------------------------------------------------
// AppError — base class
// ---------------------------------------------------------------------------
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
    // Restore prototype chain for instanceof checks after transpilation.
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): ApiErrorPayload {
    const payload: ApiErrorPayload = { code: this.code, message: this.message };
    if (this.details !== undefined) {
      payload.details = this.details;
    }
    return payload;
  }
}

// ---------------------------------------------------------------------------
// Concrete error subclasses
// ---------------------------------------------------------------------------

/** HTTP 400 — request body failed schema validation. */
export class ValidationError extends AppError {
  constructor(message = "Validation failed.", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

/** HTTP 401 — no valid session / token. */
export class UnauthorizedApiError extends AppError {
  constructor(message = "Authentication required.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

/** HTTP 403 — session valid but insufficient permissions. */
export class ForbiddenApiError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message, 403, "FORBIDDEN");
  }
}

/** HTTP 404 — requested resource does not exist. */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(message, 404, "NOT_FOUND");
  }
}

/** HTTP 409 — request conflicts with current state (e.g. duplicate proof). */
export class ConflictError extends AppError {
  constructor(message = "Request conflicts with existing data.") {
    super(message, 409, "CONFLICT");
  }
}

/** HTTP 429 — caller has exceeded the allowed request rate. */
export class RateLimitError extends AppError {
  readonly retryAfter: number;
  constructor(message = "Too many requests. Please wait and try again.", retryAfterSeconds = 60) {
    super(message, 429, "RATE_LIMITED");
    this.retryAfter = retryAfterSeconds;
  }
}

/** HTTP 500 — unexpected server-side failure. */
export class InternalError extends AppError {
  constructor(message = "Something went wrong. Please try again later.") {
    super(message, 500, "INTERNAL_ERROR");
  }
}
