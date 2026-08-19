import type { NextRequest } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { parseBody } from "@/lib/validate";
import { getBalance, refundCommission } from "@/lib/wallet";
import { logAdminAction } from "@/lib/admin-audit";
import { notify } from "@/lib/notify";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const round2 = (n: number) => Math.round(n * 100) / 100;

interface TxRow {
  id: unknown;
  type: unknown;
  amount: unknown;
  balance_after: unknown;
  description: unknown;
  created_at: unknown;
}

/** numeric columns come back as strings; the console does arithmetic on these. */
const shapeTx = (r: TxRow) => ({
  id: r.id,
  type: r.type,
  amount: Number(r.amount),
  balance_after: Number(r.balance_after),
  description: r.description,
  created_at: r.created_at,
});

/** The wallet belongs to provider_profiles, so a non-provider simply has no wallet to show. */
async function requireWalletOwner(userId: string): Promise<{ ok: true } | { ok: false; res: Response }> {
  const rows = await sql`
    SELECT u.id, pp.user_id AS has_wallet
    FROM users u LEFT JOIN provider_profiles pp ON pp.user_id = u.id
    WHERE u.id = ${userId}
  `;
  if (rows.length === 0) return { ok: false, res: error("User not found", 404) };
  if (!rows[0].has_wallet) {
    return { ok: false, res: error("This user has no wallet — only providers have one.", 400) };
  }
  return { ok: true };
}

/**
 * GET /api/admin/wallet/:userId — a provider's balance and their ledger, newest first.
 * Optional `limit` (default 100, max 500).
 */
export const GET = safe(async (
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) => {
  await requireRole(req, "admin");
  const { userId } = await params;

  const owner = await requireWalletOwner(userId);
  if (!owner.ok) return owner.res;

  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 100, 1), 500);
  const [balance, transactions] = await Promise.all([
    getBalance(userId),
    sql`
      SELECT id, type, amount, balance_after, description, created_at
      FROM wallet_transactions
      WHERE provider_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `,
  ]);

  return json({ balance, transactions: (transactions as TxRow[]).map(shapeTx) });
});

const bodySchema = z.object({
  action: z.enum(["credit", "reverse_topup", "refund_commission"]),
  amount: z.number().finite().positive().max(100_000).optional(),
  booking_id: z.string().uuid().optional(),
  // Required for EVERY action: these are hand-made money movements, and an unexplained one
  // is indistinguishable from fraud when someone reads the ledger back six months later.
  reason: z.string().trim().min(1, "A reason is required").max(500),
});

/**
 * POST /api/admin/wallet/:userId — a manual money movement on a provider's wallet.
 *
 *   credit            +amount, ledger type 'admin_credit'     (goodwill, correction)
 *   reverse_topup     -amount, ledger type 'topup_reversal'   (clawback of a bad top-up)
 *   refund_commission  refunds the commission taken for booking_id (reuses lib/wallet)
 *
 * Returns { balance, transaction }. `balance` is the balance AFTER the movement — check it:
 * a reversal is deliberately allowed to push the wallet negative (the money really did leave),
 * and the provider then cannot take work until they top back up, so the console should warn.
 */
export const POST = safe(async (
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) => {
  const admin = await requireRole(req, "admin");
  const { userId } = await params;
  const body = await parseBody(req, bodySchema);

  const owner = await requireWalletOwner(userId);
  if (!owner.ok) return owner.res;

  if (body.action === "refund_commission") {
    if (!body.booking_id) return error("booking_id is required to refund a commission.");
    const bookingId = body.booking_id;

    const bk = await sql`SELECT id, provider_id, service FROM bookings WHERE id = ${bookingId}`;
    if (bk.length === 0) return error("Booking not found", 404);
    if (String(bk[0].provider_id) !== userId) {
      return error("That booking belongs to a different provider.", 400);
    }

    // refundCommission() is a silent no-op in both of these cases (by design — it is called
    // from cancellation paths that shouldn't care). An admin pressing a button does care, so
    // say what happened instead of returning a success that moved nothing.
    const existing = await sql`
      SELECT type FROM wallet_transactions
      WHERE booking_id = ${bookingId} AND type IN ('commission', 'commission_refund')
    `;
    const types = existing.map((r) => String(r.type));
    if (!types.includes("commission")) {
      return error("No commission was charged for that booking, so there is nothing to refund.", 400);
    }
    if (types.includes("commission_refund")) {
      return error("That booking's commission has already been refunded.", 409);
    }

    await refundCommission(userId, bookingId, `Commission refund (admin): ${body.reason}`);

    const [balance, refundRows] = await Promise.all([
      getBalance(userId),
      sql`
        SELECT id, type, amount, balance_after, description, created_at
        FROM wallet_transactions
        WHERE booking_id = ${bookingId} AND type = 'commission_refund'
      `,
    ]);
    if (refundRows.length === 0) {
      // Lost a race with another refund path between the check above and the call.
      return error("The commission refund did not apply — it may have just been refunded elsewhere.", 409);
    }
    const transaction = shapeTx(refundRows[0] as TxRow);

    await logAdminAction({
      admin_id: admin.sub,
      action: "wallet.refund_commission",
      target_type: "user",
      target_id: userId,
      detail: { booking_id: bookingId, amount: transaction.amount, balance_after: balance },
      reason: body.reason,
    });
    await notify(
      userId,
      "payments",
      "Commission refunded",
      `$${transaction.amount.toFixed(2)} commission was refunded to your wallet.`,
      { entity: "wallet" }
    );

    return json({ balance, transaction });
  }

  // --- credit / reverse_topup ------------------------------------------------------------
  if (body.amount === undefined) return error("amount is required for this action.");
  const amount = round2(body.amount);
  if (!(amount > 0)) return error("amount must be greater than zero.");

  const isCredit = body.action === "credit";
  const delta = isCredit ? amount : -amount;
  const type = isCredit ? "admin_credit" : "topup_reversal";
  const description = isCredit
    ? `Admin credit: ${body.reason}`
    : `Top-up reversal: ${body.reason}`;

  // ONE statement: the balance update and its ledger row are written together, and
  // balance_after is taken from the UPDATE's own RETURNING. Never read-then-write — a
  // concurrent commission between the read and the write would be silently overwritten.
  // A reversal is allowed to take the balance below zero (unlike chargeWallet, which
  // refuses); clawing back money that was never really paid is legitimate, and the caller
  // is handed the resulting balance so it can flag it.
  const rows = await sql`
    WITH upd AS (
      UPDATE provider_profiles SET balance = balance + ${delta}
      WHERE user_id = ${userId}
      RETURNING balance
    )
    INSERT INTO wallet_transactions (provider_id, type, amount, balance_after, description)
    SELECT ${userId}::uuid, ${type}::text, ${delta}::numeric, upd.balance, ${description}::text
    FROM upd
    RETURNING id, type, amount, balance_after, description, created_at
  `;
  if (rows.length === 0) return error("This user has no wallet — only providers have one.", 400);

  const transaction = shapeTx(rows[0] as TxRow);
  const balance = transaction.balance_after;

  await logAdminAction({
    admin_id: admin.sub,
    action: isCredit ? "wallet.credit" : "wallet.reverse_topup",
    target_type: "user",
    target_id: userId,
    detail: { amount, delta, ledger_type: type, balance_after: balance, negative: balance < 0 },
    reason: body.reason,
  });

  await notify(
    userId,
    "payments",
    isCredit ? "Wallet credited" : "Wallet adjusted",
    isCredit
      ? `$${amount.toFixed(2)} was added to your PocketJobs balance.`
      : `$${amount.toFixed(2)} was reversed from your PocketJobs balance.`,
    { entity: "wallet" }
  );

  return json({ balance, transaction });
});
