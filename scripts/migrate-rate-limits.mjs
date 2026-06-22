// Postgres-backed fixed-window rate limiter store.
// Run: node --env-file=.env.local scripts/migrate-rate-limits.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS rate_limits (
    bucket text PRIMARY KEY,
    count integer NOT NULL DEFAULT 0,
    expires_at timestamptz NOT NULL
  )
`;
await sql`CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at)`;
console.log("ok: rate_limits");
console.log("DONE");
