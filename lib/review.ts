/**
 * App Store / Play Store review sign-in bypass.
 *
 * PocketJobs is passwordless (email OTP). An app-store reviewer cannot receive our
 * emailed code, so a SINGLE, env-configured demo account is allowed to sign in with a
 * fixed code instead. Everything else goes through Neon Auth as normal.
 *
 * Safety:
 *  - Disabled unless BOTH APP_REVIEW_EMAIL and APP_REVIEW_CODE are set.
 *  - Constrained to exactly one email address that we control (a demo account).
 *  - The fixed code is a secret held in env (never committed). Verification is rate
 *    limited BEFORE the bypass check (see /auth/otp/verify), so the fixed code gets the same
 *    10-attempts-per-10-minutes cap as a real one. Point this at a throwaway demo account,
 *    never a real user's email.
 *  - Both variables must be set in PRODUCTION (Netlify), not just .env.local. Without them
 *    the review email silently falls back to a normal emailed code, which a reviewer
 *    cannot receive. That is exactly how a Play review failed in October 2026.
 *
 * Set in the web app's env (and Netlify):
 *   APP_REVIEW_EMAIL=appreview@pocketjobs.co
 *   APP_REVIEW_CODE=514328        # 6 digits — the OTP field is numeric, maxlength 6
 */

export function reviewEmail(): string | null {
  const e = process.env.APP_REVIEW_EMAIL?.trim().toLowerCase();
  return e && e.includes("@") ? e : null;
}

export function reviewCode(): string | null {
  const c = process.env.APP_REVIEW_CODE?.trim();
  return c && c.length >= 4 ? c : null;
}

/** True when the bypass is enabled AND this email is the designated review account. */
export function isReviewAccount(email: string | undefined | null): boolean {
  const re = reviewEmail();
  return !!re && !!reviewCode() && (email ?? "").trim().toLowerCase() === re;
}
