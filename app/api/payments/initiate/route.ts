import { error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/**
 * POST /api/payments/initiate — DISABLED.
 *
 * PocketJobs is cash-only for jobs: customers pay providers directly in cash, and the
 * platform's only money-in is provider wallet top-ups (see /api/provider/topup). This
 * online booking-payment path captured customer money with no payout rail back to the
 * provider, so it is intentionally turned off rather than left as a money trap.
 */
export const POST = safe(async () => {
  return error(
    "Online booking payments are disabled. Pay your provider directly in cash when the job is done.",
    410
  );
});
