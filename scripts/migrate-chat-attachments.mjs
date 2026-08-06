// Chat file attachments — lets a message carry an image or document uploaded to R2.
// Additive/safe: the columns are nullable, so existing text-only messages are unaffected.
// Run: node --env-file=.env.local scripts/migrate-chat-attachments.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const steps = [
  ["messages.attachment_url", sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url text`],
  ["messages.attachment_type", sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_type text`],
  ["messages.attachment_name", sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name text`],
];
for (const [label, q] of steps) { await q; console.log("ok:", label); }
console.log("DONE");
