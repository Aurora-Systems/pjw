// Idempotent migration runner backed by the schema_migrations ledger.
//   node --env-file=.env.local scripts/migrate.mjs           # run all not-yet-applied migrate-*.mjs in order
//   node --env-file=.env.local scripts/migrate.mjs --status   # show applied vs pending
//   node --env-file=.env.local scripts/migrate.mjs --baseline # mark all current migrations applied without running
//
// Convention: migration files are scripts/migrate-*.mjs, applied in filename order. Each is
// expected to be individually idempotent (CREATE ... IF NOT EXISTS / DROP IF EXISTS), so a
// re-run is safe even if the ledger is out of sync.
import { neon } from "@neondatabase/serverless";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const sql = neon(process.env.DATABASE_URL);
const here = dirname(fileURLToPath(import.meta.url));

await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`;

const all = readdirSync(here)
  .filter((f) => f.startsWith("migrate-") && f.endsWith(".mjs"))
  .sort();
const applied = new Set((await sql`SELECT name FROM schema_migrations`).map((r) => r.name));
const pending = all.filter((f) => !applied.has(f));
const mode = process.argv[2];

if (mode === "--status") {
  console.log("APPLIED:", [...applied].sort().join(", ") || "(none)");
  console.log("PENDING:", pending.join(", ") || "(none)");
  process.exit(0);
}
if (mode === "--baseline") {
  for (const f of all) await sql`INSERT INTO schema_migrations (name) VALUES (${f}) ON CONFLICT DO NOTHING`;
  console.log(`Marked ${all.length} migrations as applied (baseline).`);
  process.exit(0);
}

if (pending.length === 0) {
  console.log("Up to date — no pending migrations.");
  process.exit(0);
}
for (const f of pending) {
  console.log(`Applying ${f} ...`);
  await import(join(here, f)); // each migration runs its statements on import
  await sql`INSERT INTO schema_migrations (name) VALUES (${f}) ON CONFLICT DO NOTHING`;
  console.log(`  recorded ${f}`);
}
console.log(`Applied ${pending.length} migration(s).`);
