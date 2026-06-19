// One review per reviewer per booking (backstop for the app-level check, race-safe).
// Run: node --env-file=.env.local scripts/migrate-review-dedup.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking_reviewer
  ON reviews(booking_id, reviewer_id) WHERE booking_id IS NOT NULL
`;
console.log("ok: unique (booking_id, reviewer_id) index");
console.log("DONE");
