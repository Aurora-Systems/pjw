"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "../../../lib/api";
import { Card, Badge, Avatar, VerifiedBadge, PageHeader, Loading, inputClass } from "../../../components/ui";
import Button from "../../../components/Button";
import MapView from "../../../components/MapView";
import type { Booking, BookingEvent, BookingStatus } from "../../../lib/types";

/** Mirrors the server state machine in app/api/bookings/[id]/route.ts (FLOW). Keep in sync. */
const FLOW: BookingStatus[] = ["confirmed", "on_the_way", "arrived", "in_progress", "completed"];
const TRACKABLE = ["confirmed", "on_the_way", "arrived", "in_progress"];

const STEP: Record<string, { label: string; provider: string; customer: string }> = {
  confirmed: { label: "Confirmed", provider: "You're booked — head over when ready", customer: "Booked. Your provider will set off soon" },
  on_the_way: { label: "On the way", provider: "You're travelling to the job", customer: "Your provider is on the way" },
  arrived: { label: "Arrived", provider: "You're on site", customer: "Your provider has arrived" },
  in_progress: { label: "Working", provider: "Work in progress", customer: "Work has started" },
  completed: { label: "Complete", provider: "Job finished", customer: "Job finished" },
};

/** The provider drives progress; this is the next step they can mark. */
const NEXT_LABEL: Record<string, string> = {
  confirmed: "I'm on the way",
  on_the_way: "I've arrived",
  arrived: "Start work",
  in_progress: "Mark complete",
};

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null;

export default function JobTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [timeline, setTimeline] = useState<BookingEvent[]>([]);
  const [role, setRole] = useState<"customer" | "provider">("customer");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api.booking(id);
      setBooking(d.booking);
      setTimeline(d.timeline ?? []);
      setRole(d.viewer_role);
      setErr(null); // clear a stale error from a prior transient poll failure
    } catch (e) {
      // Only surface the error on the first load — a blip during background polling shouldn't
      // replace a working page with an error banner.
      setBooking((b) => {
        if (!b) setErr(e instanceof ApiError ? e.message : "Could not load this job.");
        return b;
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Live-ish tracking: refresh while there's still anything to observe — that includes a completed
  // job whose cash the provider hasn't confirmed yet, so the customer sees "paid" without reloading.
  useEffect(() => {
    if (!booking) return;
    const live = TRACKABLE.includes(booking.status) || (booking.status === "completed" && booking.payment_status !== "paid");
    if (!live) return;
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [booking, load]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;
  if (!booking) return <Card className="text-center text-pj-slate-500">{err ?? "Job not found."}</Card>;

  const isProvider = role === "provider";
  const other = isProvider
    ? { name: booking.customer_name, avatar: booking.customer_avatar_url, phone: booking.customer_phone }
    : { name: booking.provider_name, avatar: booking.provider_avatar_url, phone: booking.provider_phone };

  const cancelled = booking.status === "cancelled";
  const done = booking.status === "completed";
  const idx = FLOW.indexOf(booking.status);
  const paid = booking.payment_status === "paid";
  const canCancel = ["confirmed", "on_the_way", "arrived"].includes(booking.status);

  return (
    <>
      <PageHeader
        title={booking.job_title || booking.service}
        subtitle={isProvider ? "Your job — keep the client updated." : "Track your job from confirmed to complete."}
        action={<Button variant="outline" href="/bookings">All bookings</Button>}
      />

      {err && <p className="text-sm text-red-600 mb-4">{err}</p>}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Left: status, timeline, map ── */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-pj-slate-400">Current status</div>
                <div className="mt-1 text-xl font-extrabold text-pj-slate-900">
                  {cancelled ? "Cancelled" : STEP[booking.status]?.label ?? booking.status}
                </div>
                <div className="text-sm text-pj-slate-500 mt-0.5">
                  {cancelled
                    ? booking.cancel_reason || "This booking was cancelled."
                    : isProvider
                      ? STEP[booking.status]?.provider
                      : STEP[booking.status]?.customer}
                </div>
              </div>
              <Badge color={cancelled ? "slate" : done ? "green" : "blue"}>
                {booking.status.replace(/_/g, " ")}
              </Badge>
            </div>

            {!cancelled && (
              <>
                <div className="flex items-center gap-1 mt-5">
                  {FLOW.map((s, i) => (
                    <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-pj-blue-600" : "bg-pj-slate-200"}`} />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-pj-slate-400">
                  {FLOW.map((s) => <span key={s}>{STEP[s].label}</span>)}
                </div>
              </>
            )}

            {/* Provider drives progress; the customer sees it read-only. */}
            {!cancelled && !done && (
              <div className="mt-5 flex flex-wrap gap-2">
                {isProvider && NEXT_LABEL[booking.status] && (
                  <Button
                    disabled={busy}
                    onClick={() =>
                      act(() => api.updateBooking(booking.id, FLOW[Math.min(idx + 1, FLOW.length - 1)]))
                    }
                  >
                    {busy ? "Updating…" : NEXT_LABEL[booking.status]}
                  </Button>
                )}
                {!isProvider && (
                  <span className="text-sm text-pj-slate-500 self-center">
                    Your provider updates progress here as they go.
                  </span>
                )}
                {canCancel && (
                  <Button
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      if (!window.confirm("Cancel this booking?")) return;
                      act(() => api.updateBooking(booking.id, "cancelled"));
                    }}
                  >
                    Cancel booking
                  </Button>
                )}
              </div>
            )}

            {done && (
              <div className="mt-5">
                <Button variant="outline" onClick={() => setReviewing(true)}>
                  {isProvider ? "Rate the client" : "Leave a review"}
                </Button>
              </div>
            )}
          </Card>

          {/* Live location while the job is active */}
          {TRACKABLE.includes(booking.status) && booking.provider_lat != null && booking.provider_lng != null && (
            <Card>
              <h2 className="font-bold text-pj-slate-900 mb-3">
                {isProvider ? "Your location" : `Where ${other.name?.split(" ")[0] ?? "your provider"} is`}
              </h2>
              <MapView
                height={260}
                center={{ lat: Number(booking.provider_lat), lng: Number(booking.provider_lng) }}
                markers={[
                  { id: "pro", lat: Number(booking.provider_lat), lng: Number(booking.provider_lng), title: booking.provider_name ?? "Provider" },
                  ...(booking.lat != null && booking.lng != null
                    ? [{ id: "job", lat: Number(booking.lat), lng: Number(booking.lng), title: "Job location" }]
                    : []),
                ]}
              />
              {booking.provider_location_at && (
                <p className="text-xs text-pj-slate-400 mt-2">Updated {fmt(booking.provider_location_at)}</p>
              )}
            </Card>
          )}

          {/* Audit trail — who moved the job, and when */}
          <Card>
            <h2 className="font-bold text-pj-slate-900 mb-4">Activity</h2>
            {timeline.length === 0 ? (
              <p className="text-sm text-pj-slate-500">
                Booked {fmt(booking.created_at)}. Updates will appear here as the job progresses.
              </p>
            ) : (
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-pj-slate-300" />
                  <div>
                    <div className="text-sm font-semibold text-pj-slate-900">Booking confirmed</div>
                    <div className="text-xs text-pj-slate-400">{fmt(booking.created_at)}</div>
                  </div>
                </li>
                {timeline.map((e, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-pj-blue-600" />
                    <div>
                      <div className="text-sm font-semibold text-pj-slate-900">
                        {STEP[e.to_status]?.label ?? e.to_status.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs text-pj-slate-400">
                        {fmt(e.created_at)}
                        {e.actor_name ? ` · ${e.actor_name}` : ""}
                      </div>
                      {e.note && <div className="text-sm text-pj-slate-600 mt-0.5">{e.note}</div>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/* ── Right: money, the other party, job details ── */}
        <div className="space-y-6">
          <Card>
            <h2 className="font-bold text-pj-slate-900 mb-1">Payment</h2>
            <p className="text-xs text-pj-slate-400 mb-4">Jobs are paid in cash, directly to the provider.</p>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-pj-slate-500">{paid ? "Paid" : cancelled ? "Amount" : "Amount due"}</span>
              <span className="text-2xl font-extrabold text-pj-slate-900">${booking.total ?? "—"}</span>
            </div>
            <div className="mt-4">
              {/* A cancelled booking has no payment due — never show "confirm" or "awaiting" for it. */}
              {cancelled ? (
                <div className="rounded-xl bg-pj-slate-100 px-3 py-2.5 text-sm font-medium text-pj-slate-600">
                  {paid ? "Was paid before cancellation." : "No payment due — this booking was cancelled."}
                </div>
              ) : paid ? (
                <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-700">
                  ✓ Payment confirmed{booking.paid_at ? ` · ${fmt(booking.paid_at)}` : ""}
                </div>
              ) : isProvider ? (
                <>
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={busy}
                    onClick={() => act(() => api.confirmBookingPaid(booking.id))}
                  >
                    {busy ? "Saving…" : "Confirm cash received"}
                  </Button>
                  <p className="mt-2 text-xs text-pj-slate-500">
                    Only you can confirm this — you receive the cash.
                  </p>
                </>
              ) : (
                <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-700">
                  Awaiting payment. Pay {other.name?.split(" ")[0] ?? "your provider"} in cash
                  {done ? " now the job is done." : " when the job is done."}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-pj-slate-900 mb-3">{isProvider ? "Client" : "Your provider"}</h2>
            <div className="flex items-center gap-3">
              <Avatar src={other.avatar} name={other.name} />
              <div className="min-w-0">
                <div className="font-semibold text-pj-slate-900 flex items-center gap-1 truncate">
                  {other.name ?? "—"}
                  {!isProvider && booking.provider_didit_verified && <VerifiedBadge />}
                </div>
                {!isProvider && booking.provider_rating && (
                  <div className="text-sm text-pj-slate-500">
                    ★ {booking.provider_rating} ({booking.provider_reviews_count ?? 0})
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="outline" size="sm" href="/messages">Message</Button>
              {other.phone && (
                <a
                  href={`tel:${other.phone}`}
                  className="rounded-xl border border-pj-slate-200 px-4 py-2 text-center text-sm font-semibold text-pj-slate-700 hover:bg-pj-slate-50"
                >
                  Call {other.phone}
                </a>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-pj-slate-900 mb-3">Job details</h2>
            <dl className="space-y-2.5 text-sm">
              <Row label="Service" value={booking.job_title || booking.service} />
              {booking.job_category && <Row label="Category" value={booking.job_category} />}
              {(booking.scheduled_at || booking.job_when_text) && (
                <Row label="When" value={fmt(booking.scheduled_at) ?? booking.job_when_text ?? "—"} />
              )}
              {booking.address && <Row label="Where" value={booking.address} />}
              {(booking.workers_needed ?? 1) > 1 && (
                <Row label="Team" value={`${booking.hired_count ?? 0} of ${booking.workers_needed} hired`} />
              )}
              {booking.started_at && <Row label="Started" value={fmt(booking.started_at)!} />}
              {booking.completed_at && <Row label="Completed" value={fmt(booking.completed_at)!} />}
            </dl>
            {booking.job_description && (
              <p className="mt-3 border-t border-pj-slate-100 pt-3 text-sm text-pj-slate-600 whitespace-pre-line">
                {booking.job_description}
              </p>
            )}
            {/* Customer only: /jobs/:id is the bid-management screen and lists every rival bid with
                names + prices. A hired provider must not reach their competitors' quotes from here. */}
            {!isProvider && booking.job_id && (
              <Link href={`/jobs/${booking.job_id}`} className="mt-3 inline-block text-sm font-semibold text-pj-blue-600">
                View original job →
              </Link>
            )}
          </Card>
        </div>
      </div>

      {reviewing && (
        <ReviewModal booking={booking} isProvider={isProvider} onClose={() => { setReviewing(false); load(); }} />
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-pj-slate-500 shrink-0">{label}</dt>
      <dd className="text-pj-slate-900 font-medium text-right">{value}</dd>
    </div>
  );
}

function ReviewModal({ booking, isProvider, onClose }: { booking: Booking; isProvider: boolean; onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // The two-way review API derives direction from the booking. A customer names the provider they
  // rate; a provider rating the client omits provider_id and the server records the reverse review.
  const subject = isProvider ? booking.customer_name : booking.provider_name;

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api.postReview({
        booking_id: booking.id,
        ...(isProvider ? {} : { provider_id: booking.provider_id }),
        rating,
        comment: comment || undefined,
      });
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not submit review.");
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Leave a review"
    >
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-pj-slate-900">{isProvider ? "Rate the client" : "Rate your job"}</h3>
        <p className="text-sm text-pj-slate-500 mb-4">How was {subject}?</p>
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} className={`text-3xl ${n <= rating ? "text-amber-400" : "text-pj-slate-200"}`}>★</button>
          ))}
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} className={inputClass} rows={3} placeholder="Share details of your experience…" />
        {err && <p className="text-sm text-red-600 mt-2">{err}</p>}
        <div className="flex gap-2 mt-4">
          <Button className="flex-1" disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Submit review"}</Button>
          <Button variant="ghost" onClick={onClose}>Skip</Button>
        </div>
      </div>
    </div>
  );
}
