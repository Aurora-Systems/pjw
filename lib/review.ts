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
 *  - The fixed code is a secret held in env (never committed), and normal rate limits
 *    still apply. Point this at a throwaway demo account, never a real user's email.
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
