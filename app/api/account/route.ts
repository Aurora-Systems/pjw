import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { isOurUploadUrl } from "@/lib/r2";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** PATCH /api/account — update the signed-in user's name / avatar / city. */
export const PATCH = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  let body: { full_name?: string; avatar_url?: string; city?: string; payout_number?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }

  // avatar_url, when set via this endpoint, must be one of our uploaded images.
  // (Google OAuth sets its own avatar directly server-side, bypassing this path.)
  if (body.avatar_url != null && !isOurUploadUrl(body.avatar_url)) {
    return error("avatar_url must be an uploaded image URL");
  }

  const rows = await sql`
    UPDATE users SET
      full_name = COALESCE(${body.full_name ?? null}, full_name),
      avatar_url = COALESCE(${body.avatar_url ?? null}, avatar_url),
      city = COALESCE(${body.city ?? null}, city),
      payout_number = COALESCE(${body.payout_number ?? null}, payout_number)
    WHERE id = ${auth.sub}
    RETURNING id, full_name, email, avatar_url, city, role, payout_number
  `;
  return json({ user: rows[0] });
});

/**
 * DELETE /api/account — delete the signed-in user's account and personal data.
 *
 * Soft-delete + anonymise: we strip all personal data, remove the user's listings and
 * personal records, cancel their open jobs/bids, and revoke every session — but we KEEP
 * de-identified financial + counterparty records (the wallet ledger, bookings, and reviews)
 * because they're financial/legal records the other party also relies on. The user's name
 * shows as "Deleted user" wherever those records surface. This is irreversible; any wallet
 * balance is forfeited (top-ups are non-refundable platform credit).
 */
export const DELETE = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const uid = auth.sub;

  // 1. Remove the user's public listings / live presence.
  await sql`UPDATE provider_profiles SET available = false, headline = NULL, bio = NULL, lat = NULL, lng = NULL, boost_until = NULL WHERE user_id = ${uid}`;
  await sql`DELETE FROM provider_portfolio WHERE provider_id = ${uid}`;
  await sql`DELETE FROM provider_services WHERE provider_id = ${uid}`;
  await sql`DELETE FROM provider_blocks WHERE provider_id = ${uid}`;
  await sql`UPDATE jobs SET status = 'cancelled' WHERE customer_id = ${uid} AND status = 'open'`;
  await sql`UPDATE bids SET status = 'declined' WHERE provider_id = ${uid} AND status = 'pending'`;

  // 2. Remove personal records (no counterparty / financial value).
  await sql`DELETE FROM favorites WHERE user_id = ${uid} OR provider_id = ${uid}`;
  await sql`DELETE FROM saved_addresses WHERE user_id = ${uid}`;
  await sql`DELETE FROM user_blocks WHERE blocker_id = ${uid} OR blocked_id = ${uid}`;
  await sql`DELETE FROM notification_prefs WHERE user_id = ${uid}`;
  await sql`DELETE FROM notifications WHERE user_id = ${uid}`;

  // 3. Anonymise the user, deactivate, and revoke all sessions (clearing auth_id/email lets
  //    the same person sign up fresh later instead of resurrecting this dead row).
  await sql`
    UPDATE users SET
      full_name = 'Deleted user', email = NULL, phone = NULL, avatar_url = NULL,
      city = NULL, auth_id = NULL, payout_number = NULL,
      deleted_at = now(), token_version = token_version + 1
    WHERE id = ${uid}
  `;

  return json({ ok: true });
});
