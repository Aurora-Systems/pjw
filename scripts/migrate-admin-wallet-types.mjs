// Admin console wallet: allow the two hand-made ledger types.
//
// wallet_transactions.type IS constrained (wallet_tx_type_check, added by
// migrate-batch2-integrity.mjs) to topup | commission | commission_refund | boost. The admin
// console writes two more — 'admin_credit' (manual goodwill/correction) and 'topup_reversal'
// (clawback of a top-up that never really cleared) — so without this migration
// POST /api/admin/wallet/:userId fails with a constraint violation.
//
// Widening a CHECK is additive: no existing row can violate the larger list, and nothing that
// writes today changes behaviour. DROP + ADD live in ONE ALTER TABLE so the table is never
// momentarily unconstrained. Safe to re-run.
//
// Run: node --env-file=.env.local scripts/migrate-admin-wallet-types.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

await sql`
  ALTER TABLE wallet_transactions
    DROP CONSTRAINT IF EXISTS wallet_tx_type_check,
    ADD  CONSTRAINT wallet_tx_type_check CHECK (type = ANY (ARRAY[
      'topup', 'commission', 'commission_refund', 'boost',
      'admin_credit', 'topup_reversal'
    ]))
`;
console.log("ok: wallet_tx_type_check now allows admin_credit + topup_reversal");
console.log("DONE");
