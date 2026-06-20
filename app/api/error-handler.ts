import { NextRequest, NextResponse } from "next/server";
import { AppError } from "@/lib/api/errors";
import { errorResponse } from "@/lib/api/response";
import { logger } from "@/lib/logger";
import crypto from "crypto";

type ApiHandler = (req: NextRequest, context: any) => Promise<NextResponse>;

export function withApiErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, context: any) => {
    const requestId = crypto.randomUUID();

    try {
      // Виконуємо запит далі по ланцюжку
      const response = await handler(req, context);

      // Додаємо X-Request-Id у заголовки успішних відповідей [E7]
      response.headers.set("X-Request-Id", requestId);
      return response;
    } catch (err) {
      // ── Branch 1: Наші типізовані помилки системи (AppError) ──
      if (err instanceof AppError) {
        // ПРАВИЛЬНИЙ ВИКЛИК PINO: об'єкт метаданих завжди першим!
        logger.warn(
          {
            requestId,
            code: err.code,
            status: err.statusCode,
            message: err.message,
          },
          "AppError caught in API wrapper",
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
      // Логуємо деталі (включаючи stack trace), але не показуємо їх у проді з міркувань безпеки
      logger.error(
        {
          requestId,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        },
        "Unhandled critical error caught in API wrapper",
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
