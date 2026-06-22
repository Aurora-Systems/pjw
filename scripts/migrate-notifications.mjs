// Notifications: deep-link payload + read tracking + per-type preferences.
// Run: node --env-file=.env.local scripts/migrate-notifications.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const steps = [
  ["notifications.data", sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data jsonb`],
  ["notifications type check", sql`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check`],
  ["notifications type check add", sql`ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
      CHECK (type = ANY (ARRAY['jobs','messages','payments','reviews','disputes','system']))`],
  ["notification_prefs", sql`
    CREATE TABLE IF NOT EXISTS notification_prefs (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      push_enabled boolean NOT NULL DEFAULT true,
      muted_types text[] NOT NULL DEFAULT '{}',
      updated_at timestamptz NOT NULL DEFAULT now()
    )`],
];
for (const [label, q] of steps) { await q; console.log("ok:", label); }
console.log("DONE");
