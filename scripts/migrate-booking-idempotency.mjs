// Direct-booking retry safety: a client retry must not create a 2nd booking + double commission.
// Run: node --env-file=.env.local scripts/migrate-booking-idempotency.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS idempotency_key text`;
await sql`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_idempotency_key
  ON bookings(idempotency_key) WHERE idempotency_key IS NOT NULL
`;
console.log("ok: bookings.idempotency_key + unique index");
console.log("DONE");
