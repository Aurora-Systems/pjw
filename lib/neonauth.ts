/**
 * Neon Auth (Better Auth) — passwordless email OTP.
 *
 * We use Neon Auth purely as the identity provider: it sends the OTP email and
 * verifies the code. On success we map the Neon Auth user to a local `users`
 * row (enriched with role/profile) and issue our own app JWT for the session
 * (see lib/auth.ts). This keeps the mobile client on a simple bearer token and
 * avoids Better Auth's cookie/short-lived-JWT refresh dance.
 */

const BASE_URL = process.env.NEON_AUTH_BASE_URL || "";
const ORIGIN = process.env.NEON_AUTH_ORIGIN || "http://localhost:3000";

export interface NeonAuthUser {
  id: string;
  email: string;
  name?: string | null;
}

function headers() {
  return {
    "Content-Type": "application/json",
    // Better Auth requires a trusted Origin for state-changing requests (CSRF).
    Origin: ORIGIN,
  };
}

/** Send a passwordless sign-in OTP to the given email. */
export async function sendSignInOtp(email: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/email-otp/send-verification-otp`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, type: "sign-in" }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Neon Auth send-otp failed (${res.status}): ${body}`);
  }
}

/**
 * Verify an OTP and sign the user in (auto-creates the Neon Auth user if new).
 * Returns the Neon Auth user, or null if the code is invalid.
 */
export async function verifySignInOtp(
  email: string,
  otp: string
): Promise<NeonAuthUser | null> {
  const res = await fetch(`${BASE_URL}/sign-in/email-otp`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.user) return null;
  return {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
  };
}
