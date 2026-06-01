import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/admin/verifications — providers awaiting ID/verification review. */
export async function GET(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "admin") return error("Admins only", 403);

  const queue = await sql`
    SELECT u.id, u.full_name, u.email, u.id_verified, pp.primary_category, pp.license_verified
    FROM users u JOIN provider_profiles pp ON pp.user_id = u.id
    WHERE u.role = 'provider' AND u.id_verified = false
    ORDER BY u.created_at ASC
  `;
  return json({ queue });
}

/** PATCH /api/admin/verifications — approve or reject a provider. */
export async function PATCH(req: NextRequest) {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  if (auth.role !== "admin") return error("Admins only", 403);

  let body: { user_id?: string; action?: "approve" | "reject" };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.user_id || !body.action) return error("user_id and action are required");

  if (body.action === "approve") {
    await sql`UPDATE users SET id_verified = true, verification_status = 'verified' WHERE id = ${body.user_id}`;
    await sql`UPDATE provider_profiles SET license_verified = true WHERE user_id = ${body.user_id}`;
  } else {
    await sql`UPDATE users SET verification_status = 'rejected' WHERE id = ${body.user_id}`;
  }
  await sql`
    INSERT INTO notifications (user_id, type, title, body)
    VALUES (${body.user_id}, 'account', ${"Verification " + body.action + "d"},
            ${body.action === "approve" ? "Your account is now verified." : "Please resubmit your documents."})
  `;
  return json({ ok: true });
}
