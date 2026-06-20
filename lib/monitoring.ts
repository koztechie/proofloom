/**
 * lib/monitoring.ts
 *
 * Performance monitoring and business metrics.
 */

import { logger } from "./logger";

export async function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`Execution of ${name} took ${duration}ms, exceeding 1000ms threshold`, {
        latency_ms: duration,
        operation: name,
      });
    }
  }
}

export function incrementCounter(name: string, tags?: Record<string, string>): void {
  logger.info(`Metric incremented: ${name}`, {
    metric_name: name,
    metric_type: "counter",
    tags: tags || {},
  });
}
