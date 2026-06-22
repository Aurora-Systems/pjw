/**
 * Single choke-point for reporting unexpected errors. Today it logs structured JSON; wiring
 * Sentry is then a one-line change here (after `pnpm add @sentry/nextjs` + DSN):
 *   import * as Sentry from "@sentry/nextjs"; ... Sentry.captureException(err, { extra: context });
 */
export function captureError(err: unknown, context?: Record<string, unknown>): void {
  const payload = {
    level: "error",
    ts: new Date().toISOString(),
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    ...context,
  };
  console.error(JSON.stringify(payload));
}
