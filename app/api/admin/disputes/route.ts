import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { refundCommission } from "@/lib/wallet";
import { notify } from "@/lib/notify";

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

/** GET /api/admin/disputes — open + recent disputes (with the parties for context). */
export const GET = safe(async (req: NextRequest) => {
  await requireRole(req, "admin");
  const disputes = await sql`
    SELECT d.id, d.reason, d.amount, d.category, d.status, d.created_at, d.booking_id,
           b.service, b.customer_id, b.provider_id
    FROM disputes d LEFT JOIN bookings b ON b.id = d.booking_id
    ORDER BY (d.status = 'open') DESC, d.created_at DESC LIMIT 100
  `;
  return json({ disputes });
});

/**
 * PATCH /api/admin/disputes — resolve a dispute.
 * `refund: true` refunds the provider's commission for the booking (use when the
 * outcome favours cancelling the job). Notifies both parties.
 */
export const PATCH = safe(async (req: NextRequest) => {
  await requireRole(req, "admin");

  let body: { id?: string; status?: "open" | "resolved"; refund?: boolean };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.id) return error("id is required");

  const rows = await sql`
    UPDATE disputes SET status = ${body.status ?? "resolved"} WHERE id = ${body.id} RETURNING *
  `;
  if (rows.length === 0) return error("Dispute not found", 404);
  const dispute = rows[0];

  const bk = await sql`SELECT customer_id, provider_id, service FROM bookings WHERE id = ${dispute.booking_id}`;
  if (bk.length) {
    const b = bk[0];
    if (body.refund && b.provider_id) {
      await refundCommission(b.provider_id, dispute.booking_id, "Commission refund (dispute resolved)");
    }
    const msg = `Your dispute on "${b.service}" was ${dispute.status}.`;
    if (b.customer_id) await notify(b.customer_id, "disputes", "Dispute updated", msg, { entity: "dispute", id: dispute.id });
    if (b.provider_id) await notify(b.provider_id, "disputes", "Dispute updated", msg, { entity: "dispute", id: dispute.id });
  }
  return json({ dispute });
});
