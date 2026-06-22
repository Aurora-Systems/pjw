/**
 * Product analytics via PostHog's capture REST API (no SDK dependency — plain fetch).
 * No-ops unless POSTHOG_KEY is set, so it's safe to call from anywhere. Use to instrument
 * the core funnel: signup → otp_verified → first_booking → topup, etc.
 */
const HOST = process.env.POSTHOG_HOST || "https://app.posthog.com";

export async function track(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const key = process.env.POSTHOG_KEY;
  if (!key) return;
  try {
    await fetch(`${HOST}/capture/`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ api_key: key, event, distinct_id: distinctId, properties }),
    });
  } catch (e) {
    console.error("[analytics] capture failed:", e);
  }
}
