// Schema: provider_portfolio (R2 image URLs) + DIDIT verification columns.
// Images live in Cloudflare R2 (see docs/R2_STORAGE.md), not in Postgres.
// For databases created before the R2 cutover, run scripts/migrate-uploads-to-r2.mjs
// to move legacy `uploads` (bytea) blobs into R2 and drop that table.
// Run: node --env-file=.env.local scripts/migrate-uploads.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const stmts = [
  `CREATE TABLE IF NOT EXISTS provider_portfolio (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     url TEXT NOT NULL,
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

// Detect a pre-R2 (legacy) database. On such a DB the CREATE TABLE IF NOT EXISTS
// above is a no-op (provider_portfolio already exists with upload_id, no url),
// so the app's url-based portfolio code would fail until the R2 cutover runs.
const legacy = await sql.query(
  `SELECT to_regclass('public.uploads') IS NOT NULL AS has_uploads,
          EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='provider_portfolio'
                    AND column_name='upload_id') AS has_upload_id,
          EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema='public' AND table_name='provider_portfolio'
                    AND column_name='url') AS has_url`
);
const { has_uploads, has_upload_id, has_url } = legacy[0];
if (has_uploads || has_upload_id || !has_url) {
  console.warn(
    "\n⚠️  Legacy image storage detected (uploads table / provider_portfolio.upload_id, " +
      "or missing provider_portfolio.url).\n" +
      "    The app now serves images from Cloudflare R2 and the portfolio code requires a `url` column.\n" +
      "    Run the cutover BEFORE deploying the new code:\n" +
      "      node --env-file=.env.local scripts/migrate-uploads-to-r2.mjs\n"
  );
}
console.log("DONE");
