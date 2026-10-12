import { randomUUID } from "node:crypto";
import { z } from "zod";
import { sql } from "@/lib/db";
import { broadcastEmail, broadcastText, personalize, sendEmailBatch, type BatchEmail } from "@/lib/email";
import { oneClickUnsubscribeUrl, unsubscribePageUrl } from "@/lib/unsubscribe";

/**
 * Admin mass email ("broadcasts").
 *
 * A send can't happen inside one web request: hundreds of emails would outlast the
 * function's time limit. So creating a broadcast freezes WHO gets it (one row per
 * address), and the console then calls sendNextChunk() repeatedly, CHUNK people at a time,
 * until nobody is left. Every row records its own outcome, so a send survives a closed
 * tab, a timeout or the mail provider's daily quota, and picks up where it stopped without
 * emailing anyone twice.
 */

/** Recipients per Resend batch call (its limit is 100). Kept small so each request is quick. */
const CHUNK = Math.max(1, Math.min(100, Number(process.env.BROADCAST_CHUNK) || 50));
/** A row still 'sending' this long after it was claimed was interrupted mid-send. */
const STALE_MINUTES = 10;

export const AUDIENCES = ["all", "customers", "providers", "corporate"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const broadcastSchema = z
  .object({
    audience: z.enum(AUDIENCES),
    subject: z.string().trim().min(1, "Add a subject").max(150, "Keep the subject under 150 characters"),
    body: z.string().trim().min(1, "Write the message").max(10000, "Keep the message under 10,000 characters"),
    cta_label: z.string().trim().max(40, "Keep the button text short").optional().nullable(),
    cta_url: z
      .string()
      .trim()
      .url("The button link must be a full web address")
      .refine((u) => u.startsWith("https://"), "The button link must start with https://")
      .optional()
      .nullable()
      .or(z.literal("")),
    service_notice: z.boolean().default(false),
  })
  .refine((v) => !v.cta_label === !v.cta_url, {
    message: "Give the button both a label and a link, or leave both empty",
    path: ["cta_url"],
  });
export type BroadcastInput = z.infer<typeof broadcastSchema>;

/**
 * Who an audience means. Everyone not deleted (a ban is a soft delete), never admins, with
 * a plausible email address. "Providers" means anyone with a provider profile, so a provider
 * currently in client mode still hears provider news. Unless it is a required service
 * notice, people who unsubscribed are left out.
 */
async function audienceRows(audience: Audience, serviceNotice: boolean) {
  return sql`
    SELECT DISTINCT ON (lower(trim(u.email)))
           u.id, lower(trim(u.email)) AS email,
           NULLIF(split_part(trim(u.full_name), ' ', 1), '') AS first_name
    FROM users u
    WHERE u.deleted_at IS NULL
      AND u.role <> 'admin'
      AND u.email ~* '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$'
      AND (${serviceNotice}::boolean OR u.email_unsubscribed_at IS NULL)
      AND CASE ${audience}::text
            WHEN 'all'       THEN true
            WHEN 'customers' THEN u.role = 'customer'
            WHEN 'providers' THEN EXISTS (SELECT 1 FROM provider_profiles p WHERE p.user_id = u.id)
            WHEN 'corporate' THEN u.role = 'corporate'
            ELSE false
          END
    ORDER BY lower(trim(u.email)), u.created_at
  `;
}

/** Head-counts for the audience picker: who would get it, and how many unsubscribed. */
export async function audienceCounts() {
  const rows = await sql`
    SELECT
      count(*) FILTER (WHERE NOT unsub)                                  AS all_reach,
      count(*) FILTER (WHERE unsub)                                      AS all_unsub,
      count(*) FILTER (WHERE role = 'customer' AND NOT unsub)            AS customers_reach,
      count(*) FILTER (WHERE role = 'customer' AND unsub)                AS customers_unsub,
      count(*) FILTER (WHERE is_provider AND NOT unsub)                  AS providers_reach,
      count(*) FILTER (WHERE is_provider AND unsub)                      AS providers_unsub,
      count(*) FILTER (WHERE role = 'corporate' AND NOT unsub)           AS corporate_reach,
      count(*) FILTER (WHERE role = 'corporate' AND unsub)               AS corporate_unsub
    FROM (
      SELECT DISTINCT ON (lower(trim(u.email)))
             u.role,
             EXISTS (SELECT 1 FROM provider_profiles p WHERE p.user_id = u.id) AS is_provider,
             u.email_unsubscribed_at IS NOT NULL AS unsub
      FROM users u
      WHERE u.deleted_at IS NULL AND u.role <> 'admin'
        AND u.email ~* '^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$'
      ORDER BY lower(trim(u.email)), u.created_at
    ) x
  `;
  const r = rows[0] ?? {};
  const pick = (a: Audience) => ({ reach: Number(r[`${a}_reach`] ?? 0), unsubscribed: Number(r[`${a}_unsub`] ?? 0) });
  return { all: pick("all"), customers: pick("customers"), providers: pick("providers"), corporate: pick("corporate") };
}

/** One recipient's copy: personalised, with their own unsubscribe link and headers. */
export function buildEmail(
  b: Pick<BroadcastInput, "subject" | "body" | "cta_label" | "cta_url" | "service_notice">,
  r: { user_id: string | null; email: string; first_name: string | null }
): BatchEmail {
  const content = {
    message: personalize(b.body, r.first_name),
    ctaLabel: b.cta_label || null,
    ctaUrl: b.cta_url || null,
    unsubscribeUrl: r.user_id ? unsubscribePageUrl(r.user_id) : "https://pocketjobs.co/company/contact",
    serviceNotice: !!b.service_notice,
  };
  return {
    to: r.email,
    subject: personalize(b.subject, r.first_name),
    html: broadcastEmail(content),
    text: broadcastText(content),
    // Lets Gmail, Apple Mail and Outlook show their own one-tap "Unsubscribe" button.
    headers: r.user_id
      ? {
          "List-Unsubscribe": `<${oneClickUnsubscribeUrl(r.user_id)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        }
      : undefined,
  };
}

/**
 * Freeze the recipient list and create the broadcast. The two inserts share a transaction,
 * so a failure can never leave a broadcast with half a list. Returns null when nobody is in
 * the audience.
 */
export async function createBroadcast(input: BroadcastInput, adminId: string) {
  const people = await audienceRows(input.audience, input.service_notice);
  if (people.length === 0) return null;

  const id = randomUUID();
  const userIds = people.map((p) => String(p.id));
  const emails = people.map((p) => String(p.email));
  const firstNames = people.map((p) => (p.first_name as string | null) ?? null);
  await sql.transaction([
    sql`
      INSERT INTO email_broadcasts (id, created_by, subject, body, cta_label, cta_url, audience, service_notice, status, total)
      VALUES (${id}, ${adminId}, ${input.subject}, ${input.body}, ${input.cta_label || null}, ${input.cta_url || null},
              ${input.audience}, ${input.service_notice}, 'sending', ${people.length})`,
    sql`
      INSERT INTO email_broadcast_recipients (broadcast_id, user_id, email, first_name)
      SELECT ${id}, x.user_id, x.email, x.first_name
      FROM unnest(${userIds}::uuid[], ${emails}::text[], ${firstNames}::text[]) AS x(user_id, email, first_name)
      ON CONFLICT DO NOTHING`,
  ]);
  const rows = await sql`SELECT * FROM email_broadcasts WHERE id = ${id}`;
  return rows[0] ?? null;
}

/** Live counts for one broadcast, straight from its recipient rows. */
export async function broadcastProgress(id: string) {
  const rows = await sql`
    SELECT b.id, b.status, b.status_note, b.total, b.finished_at,
           count(r.id) FILTER (WHERE r.status = 'sent')                  AS sent,
           count(r.id) FILTER (WHERE r.status = 'failed')                AS failed,
           count(r.id) FILTER (WHERE r.status IN ('pending','sending'))  AS remaining
    FROM email_broadcasts b
    LEFT JOIN email_broadcast_recipients r ON r.broadcast_id = b.id
    WHERE b.id = ${id}
    GROUP BY b.id
  `;
  const p = rows[0];
  if (!p) return null;
  return {
    id: p.id as string,
    status: p.status as "sending" | "paused" | "sent" | "cancelled",
    status_note: (p.status_note as string | null) ?? null,
    total: Number(p.total),
    sent: Number(p.sent),
    failed: Number(p.failed),
    remaining: Number(p.remaining),
    finished_at: (p.finished_at as string | null) ?? null,
  };
}

/** Why a chunk stopped short, so the console knows whether to wait, resume later or carry on. */
export type ChunkOutcome = "sent" | "rate_limited" | "paused" | "failed_chunk" | "done" | "stopped";

/**
 * Send the next CHUNK of a broadcast. Safe to call from two tabs at once: rows are claimed
 * with FOR UPDATE SKIP LOCKED, so each person is taken by exactly one call.
 */
export async function sendNextChunk(id: string) {
  const found = await sql`SELECT * FROM email_broadcasts WHERE id = ${id}`;
  const b = found[0];
  if (!b) return null;
  if (b.status === "sent" || b.status === "cancelled") {
    return { outcome: "stopped" as ChunkOutcome, progress: await broadcastProgress(id) };
  }
  // Pressing "Resume" on a paused broadcast is just calling this again.
  if (b.status === "paused") {
    await sql`UPDATE email_broadcasts SET status = 'sending', status_note = NULL WHERE id = ${id} AND status = 'paused'`;
  }

  // Rows left 'sending' by an interrupted call: we can't know whether they went out, and a
  // duplicate is worse than a miss, so record them as failed rather than retrying.
  await sql`
    UPDATE email_broadcast_recipients
    SET status = 'failed', error = 'Interrupted mid-send: may or may not have been delivered'
    WHERE broadcast_id = ${id} AND status = 'sending'
      AND claimed_at < now() - make_interval(mins => ${STALE_MINUTES})
  `;

  const claimed = await sql`
    UPDATE email_broadcast_recipients
    SET status = 'sending', claimed_at = now()
    WHERE id IN (
      SELECT id FROM email_broadcast_recipients
      WHERE broadcast_id = ${id} AND status = 'pending'
      ORDER BY id
      LIMIT ${CHUNK}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, user_id, email, first_name
  `;

  if (claimed.length === 0) {
    const progress = await broadcastProgress(id);
    if (progress && progress.remaining === 0) {
      await sql`
        UPDATE email_broadcasts
        SET status = 'sent', finished_at = now(),
            sent_count = ${progress.sent}, failed_count = ${progress.failed}
        WHERE id = ${id} AND status = 'sending'`;
      return { outcome: "done" as ChunkOutcome, progress: await broadcastProgress(id) };
    }
    // Another tab holds the last rows; let it finish them.
    return { outcome: "sent" as ChunkOutcome, progress };
  }

  const ids = claimed.map((r) => String(r.id));
  const emails = claimed.map((r) =>
    buildEmail(
      { subject: b.subject, body: b.body, cta_label: b.cta_label, cta_url: b.cta_url, service_notice: b.service_notice },
      { user_id: r.user_id as string | null, email: r.email as string, first_name: r.first_name as string | null }
    )
  );
  const result = await sendEmailBatch(emails);

  const release = () => sql`
    UPDATE email_broadcast_recipients SET status = 'pending', claimed_at = NULL
    WHERE id = ANY(${ids}::bigint[]) AND status = 'sending'`;

  let outcome: ChunkOutcome;
  if (result.ok) {
    await sql`
      UPDATE email_broadcast_recipients r
      SET status = 'sent', sent_at = now(), resend_id = x.rid, error = NULL
      FROM unnest(${ids}::bigint[], ${result.ids}::text[]) AS x(id, rid)
      WHERE r.id = x.id`;
    outcome = "sent";
  } else if (result.status === 429 && /quota/.test(result.name)) {
    // Out of sending allowance for the day or month: stop, keep everyone queued, and say why.
    await release();
    const note =
      result.name === "daily_quota_exceeded"
        ? "Paused: the mail service's daily sending limit was reached. Resume after midnight UTC."
        : "Paused: the mail service's monthly sending limit was reached. Raise the plan, then resume.";
    await sql`UPDATE email_broadcasts SET status = 'paused', status_note = ${note} WHERE id = ${id}`;
    outcome = "paused";
  } else if (result.status === 429 || result.status === 0 || result.status >= 500) {
    // Too fast, a network blip or the provider having a bad moment: try these again shortly.
    await release();
    outcome = "rate_limited";
  } else if (result.status === 401 || result.status === 403 || result.name === "not_configured") {
    // The account itself can't send (bad key, unverified domain, suspended): nothing will
    // succeed until someone fixes it, so pause instead of failing everyone.
    await release();
    const note = `Paused: the mail service refused to send (${result.message}). Fix the email settings, then resume.`;
    await sql`UPDATE email_broadcasts SET status = 'paused', status_note = ${note} WHERE id = ${id}`;
    outcome = "paused";
  } else {
    // The provider rejected this chunk outright (e.g. an address it won't accept). Record
    // it and move on, so one bad chunk doesn't stop everyone else.
    await sql`
      UPDATE email_broadcast_recipients SET status = 'failed', error = ${result.message.slice(0, 500)}
      WHERE id = ANY(${ids}::bigint[]) AND status = 'sending'`;
    outcome = "failed_chunk";
  }

  const progress = await broadcastProgress(id);
  if (progress) {
    await sql`
      UPDATE email_broadcasts SET sent_count = ${progress.sent}, failed_count = ${progress.failed}
      WHERE id = ${id}`;
  }
  return { outcome, progress, error: result.ok ? null : result.message };
}

