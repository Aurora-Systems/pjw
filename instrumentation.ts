/**
 * Next.js instrumentation — runs once when the server starts.
 * Validates env configuration so misconfig is loud at boot, not silent until first use.
 * (This is also the place to initialise Sentry once @sentry/nextjs is installed.)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
