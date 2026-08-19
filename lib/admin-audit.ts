import { sql } from "@/lib/db";

/**
 * Admin audit trail.
 *
 * The admin console can move money (manual credit, top-up reversal, commission refund),
 * revoke access (ban), change a user's role and cancel other people's jobs. Every one of
 * those writes a row here so "who did this, to what, and why" is answerable after the fact.
 *
 * House rule: EVERY state-changing admin route calls this, always AFTER the state change
 * has succeeded (never before — a logged action that then failed is worse than no log).
 */

/** Canonical action names. Free-form strings are allowed, but reuse these where they fit. */
export type AdminActionName =
  | "user.ban"
  | "user.unban"
  | "user.verify"
  | "user.unverify"
  | "user.role"
  | "job.cancel"
  | "wallet.credit"
  | "wallet.reverse_topup"
  | "wallet.refund_commission";

export interface AdminActionInput {
  admin_id: string;
  /** Prefer an `AdminActionName`; free-form is allowed for one-off actions. */
  action: AdminActionName | string;
  target_type?: string | null;
  target_id?: string | null;
  /** Free-form context (amount, previous value, …) so the row explains itself later. */
  detail?: Record<string, unknown> | null;
  reason?: string | null;
}

/**
 * Append one row to `admin_actions`.
 *
 * Deliberately best-effort: the caller has already committed the real change (banned the
 * user, moved the money), so throwing here would turn a *successful* action into a 500 and
 * invite the admin to retry it — which for a wallet credit means crediting twice. A failed
 * write is therefore captured loudly instead of propagated.
 */
export async function logAdminAction(input: AdminActionInput): Promise<void> {
  try {
    await sql`
      INSERT INTO admin_actions (admin_id, action, target_type, target_id, detail, reason)
      VALUES (
        ${input.admin_id},
        ${input.action},
        ${input.target_type ?? null},
        ${input.target_id ?? null},
        ${JSON.stringify(input.detail ?? {})}::jsonb,
        ${input.reason ?? null}
      )
    `;
  } catch (e) {
    const { captureError } = await import("@/lib/observability");
    captureError(e, { scope: "admin-audit", action: input.action, target_id: input.target_id });
  }
}
