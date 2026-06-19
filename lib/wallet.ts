import { sql } from "@/lib/db";

/**
 * Provider prepaid-wallet model.
 *
 * Providers top up a balance (which is PocketJobs revenue — there are no payouts).
 * When a provider takes a job, we deduct a 10% commission from the balance. A
 * provider must have a balance > 0 to take new work; the balance may go to zero or
 * negative after a commission, after which they must top up again.
 */

export const COMMISSION_RATE = 0.1; // 10%

/** Fixed top-up packages (USD). The amount is validated server-side against this list. */
export const TOPUP_PACKAGES = [5, 10, 20, 50];

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function getBalance(providerId: string): Promise<number> {
  const r = await sql`SELECT balance FROM provider_profiles WHERE user_id = ${providerId}`;
  return r.length ? Number(r[0].balance) : 0;
}

/** True if the provider can take new work (strictly positive balance). */
export async function canTakeWork(providerId: string): Promise<boolean> {
  return (await getBalance(providerId)) > 0;
}

/** Commission charged for a job of the given value (10%, rounded to cents). */
export function commissionFor(jobTotal: number | null | undefined): number {
  return round2(Number(jobTotal ?? 0) * COMMISSION_RATE);
}

/**
 * Deduct the 10% commission for taking a job. Records a ledger entry and returns the
 * new balance. The balance is allowed to go negative (the provider tops up to continue).
 */
export async function deductCommission(
  providerId: string,
  bookingId: string | null,
  jobTotal: number | null | undefined,
  description = "10% platform commission"
): Promise<number> {
  const commission = commissionFor(jobTotal);
  if (commission <= 0) return getBalance(providerId);
  const rows = await sql`
    UPDATE provider_profiles SET balance = balance - ${commission}
    WHERE user_id = ${providerId}
    RETURNING balance
  `;
  if (rows.length === 0) return 0;
  const balanceAfter = Number(rows[0].balance);
  await sql`
    INSERT INTO wallet_transactions (provider_id, type, amount, balance_after, booking_id, description)
    VALUES (${providerId}, 'commission', ${-commission}, ${balanceAfter}, ${bookingId}, ${description})
  `;
  return balanceAfter;
}

/**
 * Refund the commission taken for a booking (e.g. when it's cancelled before work starts).
 * Idempotent + race-safe via the unique (booking_id, type) index: a booking can only ever
 * have one 'commission_refund'. No-op if there was no commission, or it's already refunded.
 */
export async function refundCommission(
  providerId: string,
  bookingId: string,
  description = "Commission refund (cancelled job)"
): Promise<void> {
  const refunded = await sql`
    WITH ins AS (
      INSERT INTO wallet_transactions (provider_id, type, amount, balance_after, booking_id, description)
      SELECT ${providerId}, 'commission_refund', -wt.amount, 0, ${bookingId}, ${description}
      FROM wallet_transactions wt
      WHERE wt.booking_id = ${bookingId} AND wt.type = 'commission'
      ON CONFLICT (booking_id, type) WHERE booking_id IS NOT NULL DO NOTHING
      RETURNING id, amount
    )
    UPDATE provider_profiles SET balance = balance + (SELECT amount FROM ins)
    WHERE user_id = ${providerId} AND EXISTS (SELECT 1 FROM ins)
    RETURNING balance
  `;
  if (refunded.length === 0) return; // nothing to refund / already refunded
  await sql`UPDATE wallet_transactions SET balance_after = ${Number(refunded[0].balance)} WHERE booking_id = ${bookingId} AND type = 'commission_refund'`;
}

/**
 * Credit a confirmed top-up to the provider's balance. Idempotent by Pesepay
 * reference: the unique ledger index means a reference can only ever credit once,
 * so this is safe to call from both the webhook and the status poll.
 */
export async function creditTopup(providerId: string, amount: number, reference: string): Promise<void> {
  const amt = round2(Number(amount));
  if (!(amt > 0)) return;
  // One atomic statement: claim the reference (idempotent via the PARTIAL unique index —
  // the predicate must be restated in the ON CONFLICT target), increment the balance only
  // if the claim succeeded, then stamp balance_after. If the reference was already used,
  // `ins` is empty so nothing is credited (no double-credit, no money lost mid-way).
  // Claim the reference and credit the balance in ONE atomic, race-safe statement: the
  // INSERT ... ON CONFLICT acts as the lock (the partial unique index needs its predicate
  // restated), and the balance is bumped only if the claim succeeded. Returns the new
  // balance, or [] if this reference was already credited (duplicate webhook/poll).
  const credited = await sql`
    WITH ins AS (
      INSERT INTO wallet_transactions (provider_id, type, amount, balance_after, reference, description)
      VALUES (${providerId}, 'topup', ${amt}, 0, ${reference}, 'Wallet top-up')
      ON CONFLICT (reference) WHERE reference IS NOT NULL DO NOTHING
      RETURNING id
    )
    UPDATE provider_profiles SET balance = balance + ${amt}
    WHERE user_id = ${providerId} AND EXISTS (SELECT 1 FROM ins)
    RETURNING balance
  `;
  if (credited.length === 0) return; // already credited (or no such provider)
  // Stamp the running balance onto the ledger row (cosmetic; money is already correct).
  await sql`UPDATE wallet_transactions SET balance_after = ${Number(credited[0].balance)} WHERE reference = ${reference}`;
}
