// Session revocation: bumping token_version invalidates all previously issued JWTs for a user.
// Run: node --env-file=.env.local scripts/migrate-token-version.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version integer NOT NULL DEFAULT 0`;
console.log("ok: users.token_version");
console.log("DONE");
