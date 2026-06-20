import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/lib/api/errors";
import { errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import crypto from "crypto";

// Внутрішній тип хендлера, який приймає 3 аргументи для наскрізного логування
type InnerApiHandler = (
  req: NextRequest,
  context: any,
  requestId: string,
) => Promise<NextResponse>;

// Зовнішній тип хендлера для Next.js (строго 2 аргументи, щоб задовольнити валідатор Next.js 16)
type NextApiHandler = (req: NextRequest, context: any) => Promise<NextResponse>;

export function withApiErrorHandler(handler: InnerApiHandler): NextApiHandler {
  return async (req: NextRequest, context: any) => {
    const requestId = crypto.randomUUID();

    try {
      // Виконуємо запит далі по ланцюжку, передаючи requestId у внутрішній хендлер
      const response = await handler(req, context, requestId);

      // Додаємо X-Request-Id у заголовки успішних відповідей
      response.headers.set("X-Request-Id", requestId);
      return response;
    } catch (err) {
      // ── Branch 1: Наші типізовані помилки системи (AppError) ──
      if (err instanceof AppError) {
        // ПРАВИЛЬНИЙ ВИКЛИК PINO: об'єкт метаданих ЗАВЖДИ першим!
        logger.warn(
          "AppError caught in API wrapper",
          {
            requestId,
            code: err.code,
            status: err.statusCode,
            message: err.message,
          }
        );

        return errorResponse(
          err.code,
          err.message,
          err.toJSON().details,
          err.statusCode,
          requestId,
        );
      }

      // ── Branch 2: Непередбачувані критичні помилки (Unhandled Errors) ──
      // ПРАВИЛЬНИЙ ВИКЛИК PINO: об'єкт метаданих ЗАВЖДИ першим!
      logger.error(
        "Unhandled critical error caught in API wrapper",
        {
          requestId,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        }
      );

      return errorResponse(
        "INTERNAL_SERVER_ERROR",
        "Something went wrong on our servers. Please try again later.",
        undefined,
        500,
        requestId,
      );
    }
  };
}
