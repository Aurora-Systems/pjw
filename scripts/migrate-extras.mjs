// Migration: saved addresses, provider availability blocks, payout number, job/review photos.
// Run: node --env-file=.env.local scripts/migrate-extras.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const stmts = [
  `CREATE TABLE IF NOT EXISTS saved_addresses (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     label TEXT,
     address TEXT NOT NULL,
     lat DOUBLE PRECISION,
     lng DOUBLE PRECISION,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_addresses_user ON saved_addresses(user_id)`,
  `CREATE TABLE IF NOT EXISTS provider_blocks (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     start_at TIMESTAMPTZ NOT NULL,
     end_at TIMESTAMPTZ NOT NULL,
     reason TEXT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_blocks_provider ON provider_blocks(provider_id, start_at)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS payout_number TEXT`,
  `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS photos TEXT[]`,
  `ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photos TEXT[]`,
];

for (const s of stmts) {
  await sql.query(s);
  console.log("ok:", s.split("\n")[0].slice(0, 62));
}
console.log("DONE");
