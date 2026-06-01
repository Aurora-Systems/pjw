import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/corporate/profile — company account + KYC status. */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "corporate") return error("Corporate accounts only", 403);

  const rows = await sql`
    SELECT id, full_name, email, company_name, company_reg_no, city, verification_status
    FROM users WHERE id = ${auth.sub}
  `;
  return json({ profile: rows[0] });
}

/** PATCH /api/corporate/profile — submit/update company KYC details. */
export async function PATCH(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "corporate") return error("Corporate accounts only", 403);

  let body: { company_name?: string; company_reg_no?: string; submit_kyc?: boolean };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }

  const rows = await sql`
    UPDATE users SET
      company_name = COALESCE(${body.company_name ?? null}, company_name),
      company_reg_no = COALESCE(${body.company_reg_no ?? null}, company_reg_no),
      verification_status = CASE WHEN ${body.submit_kyc ?? false} THEN 'pending' ELSE verification_status END
    WHERE id = ${auth.sub}
    RETURNING id, full_name, email, company_name, company_reg_no, verification_status
  `;
  return json({ profile: rows[0] });
}
