import type { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getAuth } from "@/lib/auth";
import { json, error, preflight, safe } from "@/lib/http";
import { refundCommission } from "@/lib/wallet";
import { notify } from "@/lib/notify";

const STATUS_LABEL: Record<string, string> = {
  on_the_way: "Your provider is on the way",
  arrived: "Your provider has arrived",
  in_progress: "Work has started",
  completed: "Job marked complete",
  cancelled: "Booking cancelled",
};

export const runtime = "nodejs";

export function OPTIONS() {
  return preflight();
}

// Forward progression (provider-driven); "cancelled" is handled separately.
const FLOW = ["confirmed", "on_the_way", "arrived", "in_progress", "completed"];
const STATUSES = [...FLOW, "cancelled"];

/**
 * GET /api/bookings/:id — the shared job page for BOTH sides of a booking.
 * Returns the booking (incl. live provider location), the originating job's details, the
 * counterparty, and the status timeline so each party can see exactly where the job stands.
 */
export const GET = safe(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);
  const { id } = await params;

  const rows = await sql`
    SELECT b.*, cu.full_name AS customer_name, pr.full_name AS provider_name,
           cu.avatar_url AS customer_avatar_url, pr.avatar_url AS provider_avatar_url,
           cu.phone AS customer_phone, pr.phone AS provider_phone,
           pp.lat AS provider_base_lat, pp.lng AS provider_base_lng,
           pp.primary_category AS provider_category,
           (pr.didit_status ILIKE 'approved') AS provider_didit_verified,
           cu.client_rating AS customer_rating, cu.client_reviews_count AS customer_reviews_count,
           pp.rating AS provider_rating, pp.reviews_count AS provider_reviews_count,
           j.title AS job_title, j.description AS job_description, j.category AS job_category,
           j.when_text AS job_when_text, j.budget_min AS job_budget_min, j.budget_max AS job_budget_max,
           j.photos AS job_photos, j.workers_needed, j.hired_count
    FROM bookings b
    JOIN users cu ON cu.id = b.customer_id
    JOIN users pr ON pr.id = b.provider_id
    LEFT JOIN provider_profiles pp ON pp.user_id = b.provider_id
    LEFT JOIN jobs j ON j.id = b.job_id
    WHERE b.id = ${id} AND (b.customer_id = ${auth.sub} OR b.provider_id = ${auth.sub})
  `;
  if (rows.length === 0) return error("Booking not found", 404);

  // Status timeline (audit trail). Best-effort: an empty timeline must not break the page.
  let timeline: Record<string, unknown>[] = [];
  try {
    timeline = await sql`
      SELECT e.from_status, e.to_status, e.note, e.created_at, u.full_name AS actor_name
      FROM booking_events e
      LEFT JOIN users u ON u.id = e.actor_id
      WHERE e.booking_id = ${id}
      ORDER BY e.created_at ASC
    `;
  } catch (e) {
    console.error("[booking timeline] read failed:", e);
  }

  return json({ booking: rows[0], timeline, viewer_role: auth.sub === rows[0].provider_id ? "provider" : "customer" });
});

/** PATCH /api/bookings/:id — update booking status (tracking / completion). */
export const PATCH = safe(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await getAuth(req);
  if (!auth) return error("Unauthorized", 401);

  const { id } = await params;
  let body: { status?: string; cancel_reason?: string; no_show?: boolean };
  try {
    body = await req.json();
  } catch {
    return error("Invalid JSON body");
  }
  if (!body.status || !STATUSES.includes(body.status)) {
    return error("Valid status is required");
  }
  const target = body.status;

  const rows = await sql`
    SELECT * FROM bookings WHERE id = ${id} AND (customer_id = ${auth.sub} OR provider_id = ${auth.sub})
  `;
  if (rows.length === 0) return error("Booking not found", 404);
  const booking = rows[0];
  const current = booking.status as string;
  const isProvider = auth.sub === booking.provider_id;

  // State machine: the job progresses forward one step at a time, driven by the PROVIDER;
  // either party may cancel, but only before the work is underway.
  if (target === current) return json({ booking }); // idempotent no-op

  if (target === "cancelled") {
    if (["in_progress", "completed", "cancelled"].includes(current)) {
      return error("This booking can no longer be cancelled.", 409);
    }
  } else {
    const ci = FLOW.indexOf(current);
    const ti = FLOW.indexOf(target);
    if (ci === -1 || ti === -1) return error("Invalid status change.", 400);
    if (ti !== ci + 1) return error("Status must advance one step at a time.", 409);
    if (!isProvider) return error("Only the provider can update the job's progress.", 403);
  }

  // Conditional on the status we validated against — closes the TOCTOU window where a
  // concurrent PATCH already moved the booking on (lost-update on the state machine).
  const updated = await sql`
    UPDATE bookings SET
      status = ${target},
      started_at   = CASE WHEN ${target} = 'in_progress' THEN COALESCE(started_at, now()) ELSE started_at END,
      completed_at = CASE WHEN ${target} = 'completed'   THEN now() ELSE completed_at END,
      cancelled_at = CASE WHEN ${target} = 'cancelled'   THEN now() ELSE cancelled_at END,
      cancelled_by = CASE WHEN ${target} = 'cancelled'   THEN ${auth.sub}::uuid ELSE cancelled_by END,
      cancel_reason= CASE WHEN ${target} = 'cancelled'   THEN ${body.cancel_reason ?? null} ELSE cancel_reason END,
      no_show      = CASE WHEN ${target} = 'cancelled'   THEN ${body.no_show ?? false} ELSE no_show END
    WHERE id = ${id} AND status = ${current}
    RETURNING *
  `;
  if (updated.length === 0) {
    return error("This booking was just updated elsewhere. Refresh and try again.", 409);
  }

  // Append to the booking audit trail (best-effort — never fail the status change).
  try {
    await sql`
      INSERT INTO booking_events (booking_id, actor_id, from_status, to_status, note)
      VALUES (${id}, ${auth.sub}, ${current}, ${target}, ${body.cancel_reason ?? null})
    `;
  } catch (e) {
    console.error("[booking_events] insert failed:", e);
  }

  // Keep the underlying job in sync so it shows the same state on BOTH sides (the customer's
  // "My jobs" list reads jobs.status; the provider/booking views read bookings.status).
  //
  // A job can have up to workers_needed bookings, so a single booking must NOT decide the job's
  // fate — otherwise the first of three hired providers to tap "complete" (or "cancel") would
  // end the job for everyone.
  if (booking.job_id && target === "completed") {
    // The job is done only when no booking on it is still live.
    await sql`
      UPDATE jobs SET status = 'completed'
      WHERE id = ${booking.job_id}
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.job_id = ${booking.job_id} AND b.status NOT IN ('completed', 'cancelled')
        )
    `;
  }

  if (booking.job_id && target === "cancelled") {
    // Cancelling one hire hands that slot back so the customer can hire a replacement: drop
    // hired_count and reopen the job if it had been fully staffed. The job itself is only
    // cancelled when nothing live is left on it AND nobody remains hired.
    await sql`
      UPDATE jobs
      SET hired_count = GREATEST(hired_count - 1, 0),
          status = CASE WHEN status = 'assigned' THEN 'open' ELSE status END
      WHERE id = ${booking.job_id}
    `;
    // Only a SINGLE-hire job dies with its booking (the long-standing behaviour). A multi-hire
    // job whose hire cancels still needs people, so it just goes back to taking bids — cancelling
    // it outright would silently kill a job that still needs, say, 3 painters.
    await sql`
      UPDATE jobs SET status = 'cancelled'
      WHERE id = ${booking.job_id}
        AND workers_needed = 1
        AND hired_count = 0
        AND status <> 'completed'
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.job_id = ${booking.job_id} AND b.status NOT IN ('completed', 'cancelled')
        )
    `;
  }

  // Cancelling before work starts refunds the provider's 10% commission (the job won't happen).
  if (target === "cancelled" && booking.provider_id) {
    await refundCommission(booking.provider_id, id);
  }

  // Notify the counterparty of the status change.
  const recipient = auth.sub === booking.provider_id ? booking.customer_id : booking.provider_id;
  if (recipient) {
    await notify(recipient, "jobs", STATUS_LABEL[target] || "Booking updated", booking.service || "Your booking was updated.", {
      entity: "booking",
      id,
    });
  }

  return json({ booking: updated[0] });
});
