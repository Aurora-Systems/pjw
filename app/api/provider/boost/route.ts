import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

const PLANS: Record<string, { hours: number; pro?: boolean }> = {
  spotlight: { hours: 24 * 7 },
  boost: { hours: 24 },
  verified_pro: { hours: 24 * 30, pro: true },
};

/** POST /api/provider/boost — purchase a visibility boost (demo: no payment). */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  const plan = body.plan ? PLANS[body.plan] : null;
  if (!plan) return error("Unknown boost plan");

  const rows = await sql`
    UPDATE provider_profiles SET
      boost_until = now() + (${plan.hours} || ' hours')::interval,
      is_pro = ${plan.pro ?? false} OR is_pro
    WHERE user_id = ${auth.sub}
    RETURNING boost_until, is_pro
  `;
  return json({ ok: true, ...rows[0] });
}
