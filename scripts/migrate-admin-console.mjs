// Admin console: support enquiries + an audit trail for admin actions.
//
// Purely ADDITIVE — three brand-new tables, no existing table is altered, so nothing that
// runs today changes behaviour. Safe to re-run (IF NOT EXISTS throughout).
//
// Why an audit table: the console can move money (manual credit, top-up reversal, commission
// refund) and revoke access (ban). Those need to be attributable to a named admin with a
// stated reason, or there is no way to answer "who did this and why" after the fact.
//
// Run: node --env-file=.env.local scripts/migrate-admin-console.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const steps = [
  ["enquiries", sql`
    CREATE TABLE IF NOT EXISTS enquiries (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      -- Where it came from: the marketing site, or in-app support.
      source       text NOT NULL DEFAULT 'web',
      -- Nullable: marketing-site enquiries have no account behind them.
      user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
      name         text NOT NULL,
      email        text,
      phone        text,
      subject      text,
      message      text NOT NULL,
      status       text NOT NULL DEFAULT 'open',
      -- Which admin picked it up, and when it was closed out.
      assigned_to  uuid REFERENCES users(id) ON DELETE SET NULL,
      answered_at  timestamptz,
      created_at   timestamptz NOT NULL DEFAULT now(),
      updated_at   timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT enquiries_status_check CHECK (status IN ('open','answered','closed')),
      CONSTRAINT enquiries_source_check CHECK (source IN ('web','app'))
    )`],
  ["enquiries.idx_status", sql`
    CREATE INDEX IF NOT EXISTS enquiries_status_created_idx
      ON enquiries (status, created_at DESC)`],

  ["enquiry_replies", sql`
    CREATE TABLE IF NOT EXISTS enquiry_replies (
      id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      enquiry_id  uuid NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
      admin_id    uuid REFERENCES users(id) ON DELETE SET NULL,
      body        text NOT NULL,
      -- Set once the reply actually left the mail server; null means "recorded but not sent",
      -- which is what happens when email is not configured.
      emailed_at  timestamptz,
      created_at  timestamptz NOT NULL DEFAULT now()
    )`],
  ["enquiry_replies.idx", sql`
    CREATE INDEX IF NOT EXISTS enquiry_replies_enquiry_idx
      ON enquiry_replies (enquiry_id, created_at)`],

  ["admin_actions", sql`
    CREATE TABLE IF NOT EXISTS admin_actions (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id     uuid REFERENCES users(id) ON DELETE SET NULL,
      -- e.g. 'user.ban', 'user.verify', 'wallet.credit', 'wallet.reverse_topup'
      action       text NOT NULL,
      target_type  text,
      target_id    text,
      -- Free-form context (amount, previous value, etc.) so the row explains itself later.
      detail       jsonb NOT NULL DEFAULT '{}'::jsonb,
      reason       text,
      created_at   timestamptz NOT NULL DEFAULT now()
    )`],
  ["admin_actions.idx", sql`
    CREATE INDEX IF NOT EXISTS admin_actions_created_idx
      ON admin_actions (created_at DESC)`],
];

for (const [label, q] of steps) { await q; console.log("ok:", label); }
console.log("DONE");
