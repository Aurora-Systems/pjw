/**
 * Client-side detector for a message that looks like it's trying to move the deal
 * off-platform (phone number, email, WhatsApp/Telegram handle).
 *
 * This only drives a *warning* — we never block, redact, or alter the message. The
 * server has its own copy of this heuristic (`lib/moderation.ts` → `hasContactInfo`)
 * which flags the stored row for review; this one exists so the composer can nudge
 * the user before they hit send. Deliberately lenient to avoid false positives.
 */

/** 9+ digits with common separators — long enough to skip prices, dates and quantities. */
const PHONE = /(?:\+?\d[\s().-]?){9,}/;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const APP = /\b(whats\s?app|wsp|telegram|signal app)\b|t\.me\//i;
/** A social handle like "@johndoe". Anchored on a boundary that `\b` can't express before "@". */
const HANDLE = /(^|[\s(])@[a-z0-9_.]{4,}/i;
const KEYWORDS =
  /\b(my number|call me|text me|dm me|ecocash|cash\s?app|off\s?app|outside the app|deal directly)\b/i;

/** True if `text` likely contains a phone number, email address or outside-contact handle. */
export function looksLikeContactSharing(text: string): boolean {
  if (!text) return false;
  return (
    PHONE.test(text) ||
    EMAIL.test(text) ||
    APP.test(text) ||
    HANDLE.test(text) ||
    KEYWORDS.test(text)
  );
}

/** The copy shown next to the composer when {@link looksLikeContactSharing} matches. */
export const CONTACT_WARNING =
  "Keep chats on PocketJobs — sharing phone numbers or outside contacts early is against our terms and leaves you unprotected if something goes wrong.";
