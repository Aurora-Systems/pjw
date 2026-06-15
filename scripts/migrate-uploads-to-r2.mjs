// One-time migration: move image bytes out of the Postgres `uploads` (bytea) table
// into Cloudflare R2, rewrite every stored reference to the public R2 URL, then
// drop the legacy `uploads` table and `provider_portfolio.upload_id` column.
//
// Run: node --env-file=.env.local scripts/migrate-uploads-to-r2.mjs
//
// Requires (in .env.local): DATABASE_URL, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
//   R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL  (optional R2_KEY_PREFIX).
//
// Idempotent-ish: object keys are derived from the upload id, so re-running re-PUTs
// the same keys. The destructive DROP only runs after a clean verification pass.

import { neon } from "@neondatabase/serverless";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const need = ["DATABASE_URL", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_BASE_URL"];
const missing = need.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env: ${missing.join(", ")}`);
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const PREFIX = (process.env.R2_KEY_PREFIX || "uploads").replace(/^\/+|\/+$/g, "");
const PUBLIC_BASE = process.env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
const BUCKET = process.env.R2_BUCKET;

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const sanitizeKind = (k) => (String(k || "other").replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "other");
const keyFor = (id, kind, mime) => `${PREFIX}/${sanitizeKind(kind)}/${id}.${EXT[mime] || "bin"}`;
const publicUrl = (key) => `${PUBLIC_BASE}/${key}`;

async function tableExists(name) {
  const rows = await sql`SELECT to_regclass(${"public." + name}) AS reg`;
  return Boolean(rows[0]?.reg);
}

async function columnExists(table, column) {
  const rows = await sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${column}
  `;
  return rows.length > 0;
}

async function main() {
  if (!(await tableExists("uploads"))) {
    console.log("No `uploads` table — already migrated. Nothing to do.");
    return;
  }

  // Ensure the portfolio url column exists before we backfill it.
  await sql`ALTER TABLE provider_portfolio ADD COLUMN IF NOT EXISTS url TEXT`;
  // upload_id may already be gone if a prior run was interrupted mid-teardown.
  const hasUploadId = await columnExists("provider_portfolio", "upload_id");

  const uploads = await sql`SELECT id, kind, mime, encode(data, 'base64') AS b64 FROM uploads`;
  console.log(`Found ${uploads.length} upload(s) to migrate.`);

  /** id -> { oldUrl, newUrl } */
  const map = new Map();

  for (const u of uploads) {
    const key = keyFor(u.id, u.kind, u.mime);
    const body = Buffer.from(u.b64, "base64");
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: u.mime }));
    map.set(u.id, { oldUrl: `/api/uploads/${u.id}`, newUrl: publicUrl(key) });
    console.log(`  ✓ ${u.id} -> ${key} (${body.length} bytes)`);
  }

  console.log("Rewriting references…");
  for (const [id, { oldUrl, newUrl }] of map) {
    await sql`UPDATE users   SET avatar_url = ${newUrl} WHERE avatar_url = ${oldUrl}`;
    await sql`UPDATE jobs    SET photos = array_replace(photos, ${oldUrl}, ${newUrl}) WHERE ${oldUrl} = ANY(photos)`;
    await sql`UPDATE reviews SET photos = array_replace(photos, ${oldUrl}, ${newUrl}) WHERE ${oldUrl} = ANY(photos)`;
    if (hasUploadId) {
      await sql`UPDATE provider_portfolio SET url = ${newUrl} WHERE upload_id = ${id}`;
    }
  }

  // Verify nothing still points at the legacy endpoint and every portfolio row has a url.
  const [{ count: avatarLeft }] = await sql`SELECT count(*)::int AS count FROM users WHERE avatar_url LIKE '/api/uploads/%'`;
  const [{ count: jobsLeft }] = await sql`SELECT count(*)::int AS count FROM jobs WHERE EXISTS (SELECT 1 FROM unnest(coalesce(photos,'{}')) p WHERE p LIKE '/api/uploads/%')`;
  const [{ count: reviewsLeft }] = await sql`SELECT count(*)::int AS count FROM reviews WHERE EXISTS (SELECT 1 FROM unnest(coalesce(photos,'{}')) p WHERE p LIKE '/api/uploads/%')`;
  const [{ count: portfolioNull }] = await sql`SELECT count(*)::int AS count FROM provider_portfolio WHERE url IS NULL`;

  console.log(`Leftover refs — users:${avatarLeft} jobs:${jobsLeft} reviews:${reviewsLeft} portfolio(null url):${portfolioNull}`);
  if (avatarLeft || jobsLeft || reviewsLeft || portfolioNull) {
    console.error("Verification failed — leaving legacy table in place. Re-run after investigating.");
    process.exit(2);
  }

  console.log("Verification clean. Dropping legacy storage…");
  // Single transaction so an interrupted teardown can't leave a half-dropped,
  // un-rerunnable schema (e.g. upload_id gone but `uploads` still present).
  await sql.transaction([
    sql`ALTER TABLE provider_portfolio ALTER COLUMN url SET NOT NULL`,
    sql`ALTER TABLE provider_portfolio DROP COLUMN IF EXISTS upload_id`,
    sql`DROP TABLE IF EXISTS uploads`,
  ]);
  console.log("Done. Images now live in R2; legacy `uploads` table removed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
