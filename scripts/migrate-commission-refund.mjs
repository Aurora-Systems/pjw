// One commission + at most one refund per booking (idempotent refunds, race-safe).
// Run: node --env-file=.env.local scripts/migrate-commission-refund.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_booking_type
  ON wallet_transactions(booking_id, type) WHERE booking_id IS NOT NULL
`;
console.log("ok: unique (booking_id, type) index");
console.log("DONE");
