// Job location coordinates so providers get accurate directions to the work site.
// Run: node --env-file=.env.local scripts/migrate.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);
await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS lat double precision`;
await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS lng double precision`;
console.log("ok: jobs.lat/lng");
console.log("DONE");
