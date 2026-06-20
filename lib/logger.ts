/**
 * lib/logger.ts
 *
 * Structured JSON logger designed for AWS CloudWatch Logs ingestion and SRE observability.
 */

import { AsyncLocalStorage } from "async_hooks";
import pino from "pino";

export type LogLevel = "info" | "warn" | "error" | "debug" | "fatal";

export interface LogMeta {
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

const isDev = process.env.NODE_ENV === "development";

// Async context to automatically bind requestId and userId
export const loggerContext = new AsyncLocalStorage<LogMeta>();

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  redact: {
    paths: ["password", "password_hash", "awsSecretKey", "secret", "token"],
    censor: "[REDACTED]",
  },
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: true,
          },
        },
      }
    : {}),
  mixin() {
    // Automatically inject context if available
    const ctx = loggerContext.getStore();
    return ctx || {};
  },
});

export const logger = {
  info(message: string, meta?: LogMeta): void {
    pinoLogger.info(meta || {}, message);
  },
  warn(message: string, meta?: LogMeta): void {
    pinoLogger.warn(meta || {}, message);
  },
  error(message: string, meta?: LogMeta): void {
    pinoLogger.error(meta || {}, message);
  },
  debug(message: string, meta?: LogMeta): void {
    pinoLogger.debug(meta || {}, message);
  },
  fatal(message: string, meta?: LogMeta): void {
    pinoLogger.fatal(meta || {}, message);
  }
} as const;
