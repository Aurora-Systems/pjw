// Admin mass email ("broadcasts") + an unsubscribe flag on users.
//
// Purely ADDITIVE: two new tables and one new nullable column, so nothing that runs today
// changes behaviour. Safe to re-run (IF NOT EXISTS throughout).
//
// Why recipients are their own table: ~650 people can't be emailed inside one web request
// (the function would time out), so a send is a snapshot of who gets it, worked through in
// small chunks. Each row records whether that person was sent, failed or is still waiting,
// which is what makes a send resumable after a timeout, a closed tab or a quota limit, and
// stops anyone being emailed twice.
//
// Run: node --env-file=.env.local scripts/migrate-email-broadcasts.mjs
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL);

const steps = [
  ["users.email_unsubscribed_at", sql`
    -- Set when someone unsubscribes from announcements. Transactional email (offers,
    -- bookings, support replies) ignores it; only broadcasts honour it.
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_unsubscribed_at timestamptz`],

  ["email_broadcasts", sql`
    CREATE TABLE IF NOT EXISTS email_broadcasts (
      id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_by     uuid REFERENCES users(id) ON DELETE SET NULL,
      subject        text NOT NULL,
      body           text NOT NULL,
      cta_label      text,
      cta_url        text,
      audience       text NOT NULL,
      -- A required notice (terms change, security) also reaches people who unsubscribed.
      service_notice boolean NOT NULL DEFAULT false,
      status         text NOT NULL DEFAULT 'sending',
      -- Why it is paused, e.g. the mail provider's daily quota was reached.
      status_note    text,
      total          integer NOT NULL DEFAULT 0,
      sent_count     integer NOT NULL DEFAULT 0,
      failed_count   integer NOT NULL DEFAULT 0,
      created_at     timestamptz NOT NULL DEFAULT now(),
      finished_at    timestamptz,
      CONSTRAINT email_broadcasts_status_check CHECK (status IN ('sending','paused','sent','cancelled')),
      CONSTRAINT email_broadcasts_audience_check CHECK (audience IN ('all','customers','providers','corporate'))
    )`],
  ["email_broadcasts.idx_created", sql`
    CREATE INDEX IF NOT EXISTS email_broadcasts_created_idx ON email_broadcasts (created_at DESC)`],

  ["email_broadcast_recipients", sql`
    CREATE TABLE IF NOT EXISTS email_broadcast_recipients (
      id            bigserial PRIMARY KEY,
      broadcast_id  uuid NOT NULL REFERENCES email_broadcasts(id) ON DELETE CASCADE,
      user_id       uuid REFERENCES users(id) ON DELETE SET NULL,
      email         text NOT NULL,
      first_name    text,
      status        text NOT NULL DEFAULT 'pending',
      resend_id     text,
      error         text,
      sent_at       timestamptz,
      -- When a chunk took this row to send. A row still 'sending' long after this was
      -- interrupted mid-send; it is marked failed, never retried, so nobody gets it twice.
      claimed_at    timestamptz,
      CONSTRAINT email_broadcast_recipients_status_check CHECK (status IN ('pending','sending','sent','failed')),
      -- One email per address per broadcast, even if two accounts share an address.
      CONSTRAINT email_broadcast_recipients_unique UNIQUE (broadcast_id, email)
    )`],
  ["email_broadcast_recipients.claimed_at", sql`
    ALTER TABLE email_broadcast_recipients ADD COLUMN IF NOT EXISTS claimed_at timestamptz`],
  ["email_broadcast_recipients.idx_queue", sql`
    CREATE INDEX IF NOT EXISTS email_broadcast_recipients_queue_idx
      ON email_broadcast_recipients (broadcast_id, status, id)`],
];

for (const [name, q] of steps) {
  await q;
  console.log("ok  ", name);
}
console.log("done");
