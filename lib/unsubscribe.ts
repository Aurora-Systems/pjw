import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed, per-person unsubscribe links for announcement emails.
 *
 * The link must work without signing in (people tap it straight from their inbox), so it
 * carries a token that only the server can produce: an HMAC of the user id. Nobody can
 * unsubscribe someone else by guessing ids, and there is no table of tokens to keep.
 * The "email-unsubscribe:" prefix keeps this signature from ever being valid for anything
 * else signed with the same secret.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

export function unsubscribeToken(userId: string): string {
  return createHmac("sha256", secret()).update(`email-unsubscribe:${userId}`).digest("base64url").slice(0, 32);
}

export function verifyUnsubscribe(userId: string | null, token: string | null): userId is string {
  if (!userId || !token || !UUID.test(userId)) return false;
  const expected = Buffer.from(unsubscribeToken(userId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

const base = () => process.env.APP_PUBLIC_URL || "https://pocketjobs.co";
const query = (userId: string) => `u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`;

/** The page a person lands on from the link in the email body. It asks before acting. */
export function unsubscribePageUrl(userId: string): string {
  return `${base()}/unsubscribe?${query(userId)}`;
}

/**
 * The one-click endpoint mail apps call from their own "Unsubscribe" button (RFC 8058). It
 * is a POST, so link scanners that prefetch every URL in an email can't unsubscribe anyone.
 */
export function oneClickUnsubscribeUrl(userId: string): string {
  return `${base()}/api/email/unsubscribe?${query(userId)}`;
}
