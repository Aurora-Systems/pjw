/**
 * OneSignal push sending (server-side). Targets a user by their external id
 * (their PocketJobs user id, set via OneSignal.login on the device).
 * No-ops if OneSignal isn't configured, so callers never need to guard.
 */
const API = "https://api.onesignal.com/notifications";

export function isPushConfigured(): boolean {
  return Boolean(process.env.ONESIGNAL_APP_ID && process.env.ONESIGNAL_REST_API_KEY);
}

export async function sendPush(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!isPushConfigured()) return;
  try {
    await fetch(API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        target_channel: "push",
        include_aliases: { external_id: [userId] },
        headings: { en: title },
        contents: { en: body },
        data,
      }),
    });
  } catch {
    // Push is best-effort; never block the request on it.
  }
}
