// #49: constrain reviews.kind to the two valid values (defensive — app already only writes these).
// Run: node --env-file=.env.local scripts/migrate-reviews-kind-check.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

await sql`
  ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_kind_check
`;
await sql`
  ALTER TABLE reviews ADD CONSTRAINT reviews_kind_check
  CHECK (kind = ANY (ARRAY['provider'::text, 'client'::text]))
`;
console.log("ok: reviews_kind_check added");
console.log("DONE");
