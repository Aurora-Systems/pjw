import { sql } from "@/lib/db";

/**
 * Build a complete, machine-readable export of everything we hold about a user
 * (the "Right to Access" / "Right to Data Portability" in the privacy policy, §10).
 *
 * Only the requesting user's own data is included. Counterparty records are limited to the
 * parts that are genuinely about this user (e.g. their own messages, their bookings), so an
 * export can't be used to harvest someone else's personal data.
 */
export async function buildUserExport(userId: string) {
  const [
    user,
    providerProfile,
    services,
    portfolio,
    timeOff,
    addresses,
    favorites,
    jobs,
    bids,
    bookings,
    reviewsWritten,
    reviewsReceived,
    wallet,
    payments,
    notifications,
    prefs,
    conversations,
    messages,
    disputes,
  ] = await Promise.all([
    sql`SELECT id, email, phone, full_name, role, account_type, city, avatar_url, id_verified,
               phone_verified, verification_status, client_rating, client_reviews_count,
               created_at, deleted_at
        FROM users WHERE id = ${userId}`,
    sql`SELECT * FROM provider_profiles WHERE user_id = ${userId}`,
    sql`SELECT * FROM provider_services WHERE provider_id = ${userId}`,
    sql`SELECT id, url, created_at FROM provider_portfolio WHERE provider_id = ${userId}`,
    sql`SELECT * FROM provider_blocks WHERE provider_id = ${userId}`,
    sql`SELECT * FROM saved_addresses WHERE user_id = ${userId}`,
    sql`SELECT provider_id, created_at FROM favorites WHERE user_id = ${userId}`,
    sql`SELECT * FROM jobs WHERE customer_id = ${userId} ORDER BY created_at DESC`,
    sql`SELECT * FROM bids WHERE provider_id = ${userId} ORDER BY created_at DESC`,
    sql`SELECT * FROM bookings WHERE customer_id = ${userId} OR provider_id = ${userId} ORDER BY created_at DESC`,
    sql`SELECT id, booking_id, subject_id, kind, rating, comment, tags, photos, created_at
        FROM reviews WHERE reviewer_id = ${userId} ORDER BY created_at DESC`,
    sql`SELECT id, booking_id, kind, rating, comment, tags, created_at, provider_response, responded_at
        FROM reviews WHERE subject_id = ${userId} ORDER BY created_at DESC`,
    sql`SELECT id, type, amount, balance_after, reference, booking_id, description, created_at
        FROM wallet_transactions WHERE provider_id = ${userId} ORDER BY created_at DESC`,
    sql`SELECT id, kind, amount, currency, status, reference_number, created_at
        FROM payments WHERE user_id = ${userId} ORDER BY created_at DESC`,
    sql`SELECT id, type, title, body, read, created_at FROM notifications WHERE user_id = ${userId} ORDER BY created_at DESC`,
    sql`SELECT push_enabled, muted_types, updated_at FROM notification_prefs WHERE user_id = ${userId}`,
    sql`SELECT id, job_id, customer_id, provider_id, created_at
        FROM conversations WHERE customer_id = ${userId} OR provider_id = ${userId}`,
    // Only this user's OWN messages — not the counterparty's.
    sql`SELECT m.id, m.conversation_id, m.body, m.created_at
        FROM messages m WHERE m.sender_id = ${userId} ORDER BY m.created_at DESC`,
    sql`SELECT id, booking_id, reason, category, amount, status, created_at
        FROM disputes WHERE raised_by = ${userId} ORDER BY created_at DESC`,
  ]);

  return {
    export_generated_at: new Date().toISOString(),
    about:
      "Your PocketJobs data export. Includes your profile, activity and records. Messages listed are the ones you sent; the other party's messages are their data, not yours.",
    account: user[0] ?? null,
    provider_profile: providerProfile[0] ?? null,
    provider_services: services,
    provider_portfolio: portfolio,
    provider_time_off: timeOff,
    saved_addresses: addresses,
    saved_providers: favorites,
    jobs_posted: jobs,
    bids_made: bids,
    bookings,
    reviews_written: reviewsWritten,
    reviews_received: reviewsReceived,
    wallet_transactions: wallet,
    payments,
    notifications,
    notification_preferences: prefs[0] ?? null,
    conversations,
    messages_sent: messages,
    disputes_raised: disputes,
  };
}
