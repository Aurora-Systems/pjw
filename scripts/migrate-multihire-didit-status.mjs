// Multi-hire jobs + a first-class Didit status column.
//
//  1. jobs.workers_needed / jobs.hired_count — a job can need up to 20 people. It stays 'open'
//     (and keeps taking bids) while partially staffed, and flips to 'assigned' on the final hire.
//  2. users.didit_status — Didit's own status string. This is the ONLY source for the public
//     "Verified" badge. Do NOT use users.id_verified for that: id_verified is the
//     permission-to-work gate and an admin can grant it from the moderation queue with no KYC,
//     which is how 22 providers ended up wearing a Verified badge they never earned.
//
// Idempotent. Run: node --env-file=.env.local scripts/migrate-multihire-didit-status.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

// --- multi-hire ---------------------------------------------------------
await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS workers_needed integer NOT NULL DEFAULT 1`;
await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hired_count integer NOT NULL DEFAULT 0`;
console.log("ok: jobs.workers_needed, jobs.hired_count");

// Backfill before adding the CHECK: an accepted bid means that hire was already made.
await sql`
  UPDATE jobs j
  SET hired_count = LEAST(
    (SELECT COUNT(*) FROM bids b WHERE b.job_id = j.id AND b.status = 'accepted'),
    j.workers_needed
  )
  WHERE j.hired_count = 0
`;
console.log("ok: backfilled jobs.hired_count from accepted bids");

await sql`ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_workers_needed_check`;
await sql`ALTER TABLE jobs ADD CONSTRAINT jobs_workers_needed_check CHECK (workers_needed >= 1 AND workers_needed <= 20)`;
await sql`ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_hired_count_check`;
await sql`ALTER TABLE jobs ADD CONSTRAINT jobs_hired_count_check CHECK (hired_count >= 0 AND hired_count <= workers_needed)`;
console.log("ok: jobs CHECK constraints");

// --- didit_status -------------------------------------------------------
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS didit_status text`;
await sql`
  UPDATE users SET didit_status = didit_decision->>'status'
  WHERE didit_decision IS NOT NULL AND didit_status IS NULL
`;
await sql`CREATE INDEX IF NOT EXISTS idx_users_didit_status ON users (didit_status)`;
console.log("ok: users.didit_status (+ backfill, index)");

const [{ badged, gated }] = await sql`
  SELECT
    COUNT(*) FILTER (WHERE didit_status ILIKE 'approved')::int AS badged,
    COUNT(*) FILTER (WHERE id_verified)::int                   AS gated
  FROM users WHERE role = 'provider' AND deleted_at IS NULL
`;
console.log(`providers: ${badged} Didit-verified (badge), ${gated} allowed to work (id_verified)`);
console.log("DONE");
