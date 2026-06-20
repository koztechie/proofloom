import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn: dsn || "https://mock@mock.ingest.sentry.io/mock",
  tracesSampleRate: 1,
  debug: false,
  enabled: !!dsn, // dry-run/mock fallback if not present
});
