import { sql } from "@/lib/db";
import type { UserRole } from "@/lib/auth";

export type AccountType = "individual" | "company";

export interface LocalUser {
  id: string;
  auth_id: string | null;
  email: string | null;
  phone: string | null;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  city: string | null;
  account_type: AccountType | null;
}

/**
 * Resolve the local `users` row for a Neon Auth identity.
 * 1. Match by auth_id (returning user).
 * 2. Else match by email and link it (e.g. a seeded provider signing in for the first time).
 * 3. Else create a new user with the requested role — but ONLY when `createIfMissing`
 *    is true (an explicit sign-up). A plain sign-in for an unknown email returns null
 *    so the caller can reject it ("no account found, please sign up").
 * Providers also get a provider_profiles row on creation.
 */
export async function resolveLocalUser(
  authId: string,
  email: string,
  name?: string | null,
  role: UserRole = "customer",
  accountType?: AccountType | null,
  createIfMissing: boolean = true
): Promise<LocalUser | null> {
  const byAuth = await sql`
    SELECT id, auth_id, email, phone, full_name, role, avatar_url, city, account_type
    FROM users WHERE auth_id = ${authId}
  `;
  if (byAuth.length > 0) return byAuth[0] as LocalUser;

  const byEmail = await sql`
    SELECT id, auth_id, email, phone, full_name, role, avatar_url, city, account_type
    FROM users WHERE email = ${email}
  `;
  if (byEmail.length > 0) {
    // Link the identity only if not already linked (keeps the first provider's id;
    // a user can sign in with OTP or Google on the same email and stay one account).
    const linked = await sql`
      UPDATE users SET auth_id = COALESCE(auth_id, ${authId}) WHERE id = ${byEmail[0].id}
      RETURNING id, auth_id, email, phone, full_name, role, avatar_url, city, account_type
    `;
    return linked[0] as LocalUser;
  }

  // No existing account. A sign-in must not silently provision one.
  if (!createIfMissing) return null;

  // Default corporate-side accounts to 'company' unless they chose 'individual'.
  const resolvedType =
    role === "corporate" ? (accountType ?? "company") : null;

  const created = await sql`
    INSERT INTO users (auth_id, email, full_name, role, account_type)
    VALUES (${authId}, ${email}, ${name || email.split("@")[0]}, ${role}, ${resolvedType})
    RETURNING id, auth_id, email, phone, full_name, role, avatar_url, city, account_type
  `;
  const user = created[0] as LocalUser;

  if (user.role === "provider") {
    await sql`INSERT INTO provider_profiles (user_id) VALUES (${user.id}) ON CONFLICT DO NOTHING`;
  }
  return user;
}
