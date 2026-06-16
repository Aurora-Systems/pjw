// Wallet model: provider prepaid balance + wallet ledger + topup payments.
// Providers top up their balance (PocketJobs revenue); 10% commission is taken from
// the balance when they take a job. No payouts. Run:
//   node --env-file=.env.local scripts/migrate-wallet.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const stmts = [
  // Provider prepaid balance (can go negative after a commission; must be > 0 to take new work).
  `ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS balance NUMERIC NOT NULL DEFAULT 0`,

  // Ledger of every balance movement: top-ups (credit) and commissions (debit).
  `CREATE TABLE IF NOT EXISTS wallet_transactions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     type TEXT NOT NULL,                 -- 'topup' | 'commission' | 'adjustment'
     amount NUMERIC NOT NULL,            -- positive = credit, negative = debit
     balance_after NUMERIC NOT NULL,
     booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
     reference TEXT,                     -- Pesepay reference (top-ups); used for idempotency
     description TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_wallet_tx_provider ON wallet_transactions(provider_id, created_at DESC)`,
  // Idempotent top-ups: a Pesepay reference can only credit the wallet once.
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_reference ON wallet_transactions(reference) WHERE reference IS NOT NULL`,

  // payments table now also covers wallet top-ups (no booking).
  `ALTER TABLE payments ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'booking'`,
  `ALTER TABLE payments ALTER COLUMN booking_id DROP NOT NULL`,
];

for (const s of stmts) {
  await sql.query(s);
  console.log("ok:", s.split("\n")[0].slice(0, 70));
}
console.log("DONE");
