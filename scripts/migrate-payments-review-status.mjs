// Allow payments.status = 'review' (used when Pesepay's confirmed amount != the requested amount).
// Without this the amount-mismatch flagging throws against payments_status_check.
// Run: node --env-file=.env.local scripts/migrate-payments-review-status.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check`;
await sql`
  ALTER TABLE payments ADD CONSTRAINT payments_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'cancelled'::text, 'review'::text]))
`;
console.log("ok: payments_status_check now allows 'review'");
console.log("DONE");
