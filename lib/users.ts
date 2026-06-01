import { sql } from "@/lib/db";
import type { UserRole } from "@/lib/auth";

export interface LocalUser {
  id: string;
  auth_id: string | null;
  email: string | null;
  phone: string | null;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  city: string | null;
}

/**
 * Resolve the local `users` row for a Neon Auth identity.
 * 1. Match by auth_id (returning user).
 * 2. Else match by email and link it (e.g. a seeded provider signing in for the first time).
 * 3. Else create a new user with the requested role.
 * Providers also get a provider_profiles row on creation.
 */
export async function resolveLocalUser(
  authId: string,
  email: string,
  name?: string | null,
  role: UserRole = "customer"
): Promise<LocalUser> {
  const byAuth = await sql`
    SELECT id, auth_id, email, phone, full_name, role, avatar_url, city
    FROM users WHERE auth_id = ${authId}
  `;
  if (byAuth.length > 0) return byAuth[0] as LocalUser;

  const byEmail = await sql`
    SELECT id, auth_id, email, phone, full_name, role, avatar_url, city
    FROM users WHERE email = ${email}
  `;
  if (byEmail.length > 0) {
    const linked = await sql`
      UPDATE users SET auth_id = ${authId} WHERE id = ${byEmail[0].id}
      RETURNING id, auth_id, email, phone, full_name, role, avatar_url, city
    `;
    return linked[0] as LocalUser;
  }

  const created = await sql`
    INSERT INTO users (auth_id, email, full_name, role)
    VALUES (${authId}, ${email}, ${name || email.split("@")[0]}, ${role})
    RETURNING id, auth_id, email, phone, full_name, role, avatar_url, city
  `;
  const user = created[0] as LocalUser;

  if (user.role === "provider") {
    await sql`INSERT INTO provider_profiles (user_id) VALUES (${user.id}) ON CONFLICT DO NOTHING`;
  }
  return user;
}
