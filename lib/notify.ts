import { sql } from "@/lib/db";
import { sendPush } from "@/lib/push";

/** Canonical in-app notification categories (used for icon/route mapping on the client). */
export const NOTIFICATION_TYPES = [
  "jobs", // bids, job/booking lifecycle
  "messages", // new chat message
  "payments", // top-ups, commission, refunds
  "reviews", // a review you received
  "disputes", // dispute filed/resolved
  "system", // everything else
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * Record an in-app notification AND send a push (OneSignal) to the user.
 * Best-effort: notifications are a side effect, so a failure here must NEVER
 * fail the caller's primary write (e.g. creating a booking). Errors are logged.
 */
export async function notify(
  userId: string,
  type: NotificationType | string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const t = (NOTIFICATION_TYPES as readonly string[]).includes(type) ? type : "system";

  // Respect per-user notification preferences (muted types / push off). Best-effort.
  let pushEnabled = true;
  try {
    const prefs = await sql`SELECT push_enabled, muted_types FROM notification_prefs WHERE user_id = ${userId}`;
    if (prefs.length) {
      if ((prefs[0].muted_types as string[] | null)?.includes(t)) return; // fully muted: no row, no push
      pushEnabled = prefs[0].push_enabled !== false;
    }
  } catch (e) {
    console.error("[notify] prefs lookup failed:", e);
  }

  try {
    await sql`
      INSERT INTO notifications (user_id, type, title, body, data)
      VALUES (${userId}, ${t}, ${title}, ${body}, ${data ? JSON.stringify(data) : null})
    `;
  } catch (e) {
    console.error("[notify] insert failed:", e);
  }
  if (!pushEnabled) return;
  try {
    await sendPush(userId, title, body, data);
  } catch (e) {
    console.error("[notify] push failed:", e);
  }
}
