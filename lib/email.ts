/**
 * Email channel via Resend's REST API (no SDK dependency — plain fetch).
 * No-ops if RESEND_API_KEY / RESEND_FROM aren't set, so callers never need to guard.
 * Use for high-value, off-app events (bid accepted, top-up confirmed, verification result).
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!isEmailConfigured()) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: process.env.RESEND_FROM, to, subject, html }),
    });
    if (!res.ok) console.error("[email] send failed:", res.status, await res.text());
  } catch (e) {
    console.error("[email] error (best-effort):", e);
  }
}
