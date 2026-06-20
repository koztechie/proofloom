/**
 * app/api/metrics/route.ts
 *
 * Simple endpoint to expose basic application metrics in OpenMetrics format for Prometheus ingestion.
 */

import { NextResponse } from "next/server";

export async function GET() {
  // Simple OpenMetrics format output
  // In a real application, this would pull from a metrics registry
  const metrics = `
# HELP proofloom_health_status Indicates overall health status (1 = healthy, 0 = degraded)
# TYPE proofloom_health_status gauge
proofloom_health_status 1
# HELP proofloom_up Indicates if the metrics endpoint is reachable
# TYPE proofloom_up gauge
proofloom_up 1
  `.trim() + "\n";
  
  return new NextResponse(metrics, {
    headers: {
      "Content-Type": "text/plain; version=0.0.4",
    },
  });
}
