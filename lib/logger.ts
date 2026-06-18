/**
 * lib/logger.ts
 *
 * Structured JSON logger designed for AWS CloudWatch Logs ingestion.
 *
 * Every log line is a single-line JSON object. CloudWatch can parse and
 * filter structured JSON automatically via Logs Insights queries such as:
 *   fields @timestamp, level, requestId, message
 *   | filter level = "error"
 *
 * Log levels: "info" | "warn" | "error"
 *
 * Usage:
 *   logger.info("Proof submitted", { requestId, userId: user.id });
 *   logger.error("Unexpected failure", { requestId, error });
 */

export type LogLevel = "info" | "warn" | "error";

export interface LogMeta {
  /** Unique per-request trace identifier — set by withApiErrorHandler. */
  requestId?: string;
  /** Any additional structured fields (serialisable values only). */
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  [key: string]: unknown;
}

const SERVICE_NAME = process.env.SERVICE_NAME ?? "proofloom-api";

function buildEntry(level: LogLevel, message: string, meta: LogMeta): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: SERVICE_NAME,
    ...meta,
  };
}

function emit(level: LogLevel, message: string, meta: LogMeta = {}): void {
  const entry = buildEntry(level, message, meta);
  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info(message: string, meta?: LogMeta): void {
    emit("info", message, meta);
  },
  warn(message: string, meta?: LogMeta): void {
    emit("warn", message, meta);
  },
  error(message: string, meta?: LogMeta): void {
    emit("error", message, meta);
  },
} as const;
