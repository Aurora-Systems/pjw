// Saved/favourite providers (retention loop: re-find + one-tap rebook).
// Run: node --env-file=.env.local scripts/migrate-favorites.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

await sql`
  CREATE TABLE IF NOT EXISTS favorites (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, provider_id)
  )
`;
console.log("ok: favorites");
console.log("DONE");
