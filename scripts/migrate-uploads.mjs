// Migration: uploads (image blobs), provider_portfolio, DIDIT verification columns.
// Run: node --env-file=.env.local scripts/migrate-uploads.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const stmts = [
  `CREATE TABLE IF NOT EXISTS uploads (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
     kind TEXT NOT NULL DEFAULT 'other',
     mime TEXT NOT NULL,
     data BYTEA NOT NULL,
     byte_size INT,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE TABLE IF NOT EXISTS provider_portfolio (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS idx_portfolio_provider ON provider_portfolio(provider_id)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS didit_session_id TEXT`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS didit_decision JSONB`,
];

for (const s of stmts) {
  await sql.query(s);
  console.log("ok:", s.split("\n")[0].slice(0, 60));
}
console.log("DONE");
