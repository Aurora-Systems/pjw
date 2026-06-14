import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/provider/services — the signed-in provider's services. */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);
  const services = await sql`
    SELECT id, category, title, rate, rate_type FROM provider_services WHERE provider_id = ${auth.sub} ORDER BY title
  `;
  return json({ services });
}

/** POST /api/provider/services — add a service (category, title, rate, rate_type). */
export async function POST(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "provider") return error("Providers only", 403);

  let body: { category?: string; title?: string; rate?: number; rate_type?: string };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.title || body.rate == null) return error("title and rate are required");
  const rateType = ["hourly", "fixed", "min"].includes(body.rate_type || "")
    ? body.rate_type
    : "hourly";

  const rows = await sql`
    INSERT INTO provider_services (provider_id, category, title, rate, rate_type)
    VALUES (${auth.sub}, ${body.category ?? null}, ${body.title}, ${body.rate}, ${rateType})
    RETURNING id, category, title, rate, rate_type
  `;
  return json({ service: rows[0] }, { status: 201 });
}
