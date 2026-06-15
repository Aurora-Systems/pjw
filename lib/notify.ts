import { sql } from "@/lib/db";
import { sendPush } from "@/lib/push";

/**
 * Record an in-app notification AND send a push (OneSignal) to the user.
 * Use this everywhere instead of inserting into `notifications` directly.
 */
export async function notify(
  userId: string,
  type: string,
  title: string,
  body: string
): Promise<void> {
  await sql`
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (${userId}, ${type}, ${title}, ${body})
  `;
  await sendPush(userId, title, body);
}
