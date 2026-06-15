import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/provider/profile — the provider's own profile + services. */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  const rows = await sql`
    SELECT u.full_name, u.email, u.city, u.payout_number, pp.*
    FROM users u JOIN provider_profiles pp ON pp.user_id = u.id
    WHERE u.id = ${auth.sub}
  `;
  if (rows.length === 0) return error("Profile not found", 404);
  const services = await sql`
    SELECT id, category, title, rate, rate_type FROM provider_services WHERE provider_id = ${auth.sub}
  `;
  return json({ profile: rows[0], services });
}

/** PATCH /api/provider/profile — update headline/bio/rate/availability/category. */
export async function PATCH(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  let body: {
    headline?: string;
    bio?: string;
    hourly_rate?: number;
    primary_category?: string;
    years_experience?: number;
    available?: boolean;
    onboarded?: boolean;
    city?: string;
  };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }

  const rows = await sql`
    UPDATE provider_profiles SET
      headline = COALESCE(${body.headline ?? null}, headline),
      bio = COALESCE(${body.bio ?? null}, bio),
      hourly_rate = COALESCE(${body.hourly_rate ?? null}, hourly_rate),
      primary_category = COALESCE(${body.primary_category ?? null}, primary_category),
      years_experience = COALESCE(${body.years_experience ?? null}, years_experience),
      available = COALESCE(${body.available ?? null}, available),
      onboarded = COALESCE(${body.onboarded ?? null}, onboarded)
    WHERE user_id = ${auth.sub}
    RETURNING *
  `;
  if (body.city) {
    await sql`UPDATE users SET city = ${body.city} WHERE id = ${auth.sub}`;
  }
  return json({ profile: rows[0] });
}
