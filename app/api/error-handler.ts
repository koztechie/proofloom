/**
 * app/api/error-handler.ts
 *
 * Higher-order wrapper that standardises error handling across all API routes.
 *
 * What it does:
 *   1. Generates a unique requestId (crypto.randomUUID) for every request.
 *   2. Injects the requestId into every response via X-Request-Id header.
 *   3. Catches AppError subclasses → logs them and returns their structured payload.
 *   4. Catches the auth guard errors (UnauthorizedError / ForbiddenError from
 *      lib/auth/guards) → bridges them to the API error hierarchy.
 *   5. Catches unknown errors → logs the full stack internally but returns a
 *      generic InternalError message to the client (no stack leak in production).
 *
 * Usage:
 *   export const GET = withApiErrorHandler(async (req, ctx, requestId) => {
 *     const user = await requireAuth({ redirectOnFailure: false });
 *     ...
 *     return successResponse(data, undefined, 200, requestId);
 *   });
 */

import type { NextRequest } from "next/server";
import {
  AppError,
  InternalError,
  UnauthorizedApiError,
  ForbiddenApiError,
} from "@/lib/api/errors";
import { errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logger";
// Guard errors — bridged to API error hierarchy below
import {
  UnauthorizedError as GuardUnauthorizedError,
  ForbiddenError as GuardForbiddenError,
} from "@/lib/auth/guards";

// ---------------------------------------------------------------------------
// Handler type
// ---------------------------------------------------------------------------

/**
 * Extended handler signature — receives the raw NextRequest, an optional
 * route context (for dynamic params), and the pre-generated requestId.
 */
export type ApiHandler<TContext = unknown> = (
  req: NextRequest,
  ctx: TContext,
  requestId: string,
) => Promise<Response>;

// ---------------------------------------------------------------------------
// withApiErrorHandler
// ---------------------------------------------------------------------------

export function withApiErrorHandler<TContext = unknown>(
  handler: ApiHandler<TContext>,
): (req: NextRequest, ctx: TContext) => Promise<Response> {
  return async (req: NextRequest, ctx: TContext): Promise<Response> => {
    const requestId = crypto.randomUUID();

    try {
      return await handler(req, ctx, requestId);
    } catch (err: unknown) {
      // ── Branch 1: Our typed AppError subclasses ──────────────────────────
      if (err instanceof AppError) {
        logger.warn("AppError caught", {
          requestId,
          code: err.code,
          status: err.statusCode,
          message: err.message,
        });

        const res = errorResponse(
          err.code,
          err.message,
          err.details,
          err.statusCode,
          requestId,
        );

        // RateLimitError carries a retryAfter value — surface it as a header.
        if ("retryAfter" in err && typeof (err as { retryAfter: unknown }).retryAfter === "number") {
          res.headers.set("Retry-After", String((err as { retryAfter: number }).retryAfter));
        }

        return res;
      }

      // ── Branch 2: Auth guard errors (lib/auth/guards) ────────────────────
      // Bridge guard errors to the API hierarchy for a consistent envelope.
      if (err instanceof GuardUnauthorizedError) {
        logger.warn("Auth guard: Unauthorized", {
          requestId,
          message: err.message,
        });
        const bridged = new UnauthorizedApiError(err.message);
        return errorResponse(
          bridged.code,
          bridged.message,
          undefined,
          bridged.statusCode,
          requestId,
        );
      }

      if (err instanceof GuardForbiddenError) {
        logger.warn("Auth guard: Forbidden", {
          requestId,
          message: err.message,
        });
        const bridged = new ForbiddenApiError(err.message);
        return errorResponse(
          bridged.code,
          bridged.message,
          undefined,
          bridged.statusCode,
          requestId,
        );
      }

      // ── Branch 3: Unexpected / unhandled error ───────────────────────────
      const stack = err instanceof Error ? err.stack : String(err);
      const rawMessage = err instanceof Error ? err.message : "Unknown error";

      logger.error("Unhandled exception in API route", {
        requestId,
        message: rawMessage,
        stack,
      });

      const internal = new InternalError();
      // In development expose the real error message; hide it in production.
      const clientMessage =
        process.env.NODE_ENV === "production" ? internal.message : rawMessage;

      return errorResponse(
        internal.code,
        clientMessage,
        undefined,
        internal.statusCode,
        requestId,
      );
    }
  };
}
