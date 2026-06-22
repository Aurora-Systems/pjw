import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/workforce — the corporate account's bulk workforce requests. */
export const GET = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "corporate") return error("Corporate accounts only", 403);

  const requests = await sql`
    SELECT * FROM workforce_requests WHERE corporate_id = ${auth.sub} ORDER BY created_at DESC
  `;
  return json({ requests });
});

/** POST /api/workforce — post a bulk workforce request to the verified pool. */
export const POST = safe(async (req: NextRequest) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "corporate") return error("Corporate accounts only", 403);

  let body: {
    role_skill?: string;
    headcount?: number;
    hours_per_day?: number;
    start_date?: string;
    end_date?: string;
    site?: string;
    requirements?: string[];
    rate?: number;
  };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.role_skill) return error("role_skill is required");

  const headcount = body.headcount ?? 1;
  const hours = body.hours_per_day ?? 8;
  const rate = body.rate ?? 4;
  // days span inclusive (demo estimate)
  let days = 1;
  if (body.start_date && body.end_date) {
    const ms = new Date(body.end_date).getTime() - new Date(body.start_date).getTime();
    days = Math.max(1, Math.round(ms / 86400000) + 1);
  }
  const base = headcount * hours * days * rate;
  const estimated = Math.round(base * 1.08 * 100) / 100; // +8% corporate fee

  const rows = await sql`
    INSERT INTO workforce_requests
      (corporate_id, role_skill, headcount, hours_per_day, start_date, end_date, site, requirements, rate, estimated_cost)
    VALUES (${auth.sub}, ${body.role_skill}, ${headcount}, ${hours},
            ${body.start_date ?? null}, ${body.end_date ?? null}, ${body.site ?? null},
            ${body.requirements ?? null}, ${rate}, ${estimated})
    RETURNING *
  `;
  return json({ request: rows[0] }, { status: 201 });
});
