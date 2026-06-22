// Batch 5 — trust & safety schema. Additive/safe.
// Run: node --env-file=.env.local scripts/migrate-batch5-trust.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const steps = [
  ["user_blocks", sql`
    CREATE TABLE IF NOT EXISTS user_blocks (
      blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (blocker_id, blocked_id)
    )`],
  ["user_reports", sql`
    CREATE TABLE IF NOT EXISTS user_reports (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reported_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reason text NOT NULL,
      context text,
      status text NOT NULL DEFAULT 'open',
      created_at timestamptz NOT NULL DEFAULT now()
    )`],
  ["reports idx", sql`CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status, created_at DESC)`],
  ["reviews.flagged", sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false`],
  ["reviews.flag_reason", sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS flag_reason text`],
  ["reviews.provider_response", sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS provider_response text`],
  ["reviews.responded_at", sql`ALTER TABLE reviews ADD COLUMN IF NOT EXISTS responded_at timestamptz`],
  ["messages.flagged", sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false`],
];
for (const [label, q] of steps) { await q; console.log("ok:", label); }
console.log("DONE");
