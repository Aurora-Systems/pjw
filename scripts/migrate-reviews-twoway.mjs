// Two-way reviews: customers review providers (kind='provider') AND providers review
// clients (kind='client'). `subject_id` is whoever the review is about; client ratings
// aggregate onto users.client_rating / client_reviews_count.
// Run: node --env-file=.env.local scripts/migrate-reviews-twoway.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const stmts = [
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS subject_id UUID`,
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'provider'`,
  `ALTER TABLE reviews ALTER COLUMN provider_id DROP NOT NULL`,
  // Backfill existing provider reviews so subject_id is always populated.
  `UPDATE reviews SET subject_id = provider_id WHERE subject_id IS NULL`,
  `CREATE INDEX IF NOT EXISTS idx_reviews_subject ON reviews(subject_id, kind)`,
  // Client (customer) reputation aggregate.
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS client_rating NUMERIC`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS client_reviews_count INT NOT NULL DEFAULT 0`,
];

for (const s of stmts) {
  await sql.query(s);
  console.log("ok:", s.split("\n")[0].slice(0, 70));
}
console.log("DONE");
