// Batch 2 — data integrity. All additive/safe (live data already conforms).
// Run: node --env-file=.env.local scripts/migrate-batch2-integrity.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const steps = [
  // 1. Money columns: explicit precision (match every other money column) + invariants.
  ["balance precision", sql`ALTER TABLE provider_profiles ALTER COLUMN balance TYPE numeric(12,2)`],
  ["amount precision", sql`ALTER TABLE wallet_transactions ALTER COLUMN amount TYPE numeric(12,2)`],
  ["balance_after precision", sql`ALTER TABLE wallet_transactions ALTER COLUMN balance_after TYPE numeric(12,2)`],
  ["amount<>0 check", sql`ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_tx_amount_nonzero`],
  ["amount<>0 check add", sql`ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_tx_amount_nonzero CHECK (amount <> 0)`],
  ["type check", sql`ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_tx_type_check`],
  ["type check add", sql`ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_tx_type_check
      CHECK (type = ANY (ARRAY['topup','commission','commission_refund','boost']))`],

  // 2. Protect the money ledger from cascade-deletes (force soft-delete instead).
  ["drop wt booking fk", sql`ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_booking_id_fkey`],
  ["add wt booking fk restrict", sql`ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_booking_id_fkey
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT`],
  ["drop wt provider fk", sql`ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_provider_id_fkey`],
  ["add wt provider fk restrict", sql`ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_provider_id_fkey
      FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE RESTRICT`],

  // 3. Category referential integrity (live data already conforms).
  ["jobs category fk", sql`ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_category_fkey`],
  ["jobs category fk add", sql`ALTER TABLE jobs ADD CONSTRAINT jobs_category_fkey
      FOREIGN KEY (category) REFERENCES categories(slug) ON UPDATE CASCADE ON DELETE RESTRICT`],
  ["pp category fk", sql`ALTER TABLE provider_profiles DROP CONSTRAINT IF EXISTS provider_profiles_primary_category_fkey`],
  ["pp category fk add", sql`ALTER TABLE provider_profiles ADD CONSTRAINT provider_profiles_primary_category_fkey
      FOREIGN KEY (primary_category) REFERENCES categories(slug) ON UPDATE CASCADE ON DELETE RESTRICT`],
  ["svc category fk", sql`ALTER TABLE provider_services DROP CONSTRAINT IF EXISTS provider_services_category_fkey`],
  ["svc category fk add", sql`ALTER TABLE provider_services ADD CONSTRAINT provider_services_category_fkey
      FOREIGN KEY (category) REFERENCES categories(slug) ON UPDATE CASCADE ON DELETE RESTRICT`],

  // 4. Booking lifecycle timestamps + cancellation/no-show accountability.
  ["bk started_at", sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS started_at timestamptz`],
  ["bk completed_at", sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS completed_at timestamptz`],
  ["bk cancelled_at", sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at timestamptz`],
  ["bk cancelled_by", sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_by uuid`],
  ["bk cancel_reason", sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_reason text`],
  ["bk no_show", sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS no_show boolean NOT NULL DEFAULT false`],

  // 5. Soft-delete for users (protects the ledger; lets us ban/remove without cascade).
  ["users deleted_at", sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at timestamptz`],

  // 6. Booking status-transition audit trail.
  ["booking_events table", sql`
    CREATE TABLE IF NOT EXISTS booking_events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
      from_status text,
      to_status text NOT NULL,
      note text,
      created_at timestamptz NOT NULL DEFAULT now()
    )`],
  ["booking_events idx", sql`CREATE INDEX IF NOT EXISTS idx_booking_events_booking ON booking_events(booking_id, created_at)`],

  // 7. Hot foreign-key indexes for list queries.
  ["idx bookings provider", sql`CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id, created_at DESC)`],
  ["idx bookings customer", sql`CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id, created_at DESC)`],
  ["idx bookings job", sql`CREATE INDEX IF NOT EXISTS idx_bookings_job ON bookings(job_id)`],
  ["idx conversations customer", sql`CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id)`],
  ["idx conversations provider", sql`CREATE INDEX IF NOT EXISTS idx_conversations_provider ON conversations(provider_id)`],
  ["idx notifications user", sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC)`],
  ["idx jobs customer", sql`CREATE INDEX IF NOT EXISTS idx_jobs_customer ON jobs(customer_id, created_at DESC)`],
  ["idx jobs status cat", sql`CREATE INDEX IF NOT EXISTS idx_jobs_status_cat ON jobs(status, category)`],
  ["idx bids provider", sql`CREATE INDEX IF NOT EXISTS idx_bids_provider ON bids(provider_id)`],
  ["idx bids job", sql`CREATE INDEX IF NOT EXISTS idx_bids_job ON bids(job_id)`],
  ["idx reviews subject", sql`CREATE INDEX IF NOT EXISTS idx_reviews_subject ON reviews(subject_id, created_at DESC)`],
  ["idx messages conversation", sql`CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at)`],

  // 8. Migration ledger (records which migrations have been applied).
  ["schema_migrations", sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`],
];

for (const [label, q] of steps) {
  await q;
  console.log("ok:", label);
}
console.log("DONE");
