"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Card, Badge, PageHeader, Loading, Empty, inputClass } from "../../components/ui";
import Button from "../../components/Button";
import type { Booking, BookingStatus } from "../../lib/types";

const FLOW: BookingStatus[] = ["confirmed", "on_the_way", "arrived", "in_progress", "completed"];
const NEXT_LABEL: Record<string, string> = {
  confirmed: "Mark on the way",
  on_the_way: "Mark arrived",
  arrived: "Start work",
  in_progress: "Mark complete",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<Booking | null>(null);

  const load = async () => {
    const { bookings } = await api.bookings();
    setBookings(bookings);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const advance = async (b: Booking) => {
    const next = FLOW[Math.min(FLOW.indexOf(b.status) + 1, FLOW.length - 1)];
    setBusy(b.id);
    try {
      const { booking } = await api.updateBooking(b.id, next);
      setBookings((cur) => cur.map((x) => (x.id === b.id ? booking : x)));
      if (next === "completed") setReviewing(booking);
    } finally {
      setBusy(null);
    }
  };

  const pay = async (b: Booking) => {
    setPaying(b.id);
    try {
      const { redirectUrl } = await api.initiatePayment(b.id);
      // Remember which payment we're returning from, then hand off to Pesepay.
      sessionStorage.setItem("pj_pay_booking", b.id);
      window.location.href = redirectUrl;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not start payment");
      setPaying(null);
    }
  };

  if (loading) return <Loading />;
  return (
    <>
      <PageHeader title="My bookings" subtitle="Track your jobs from confirmed to complete." />
      {bookings.length === 0 ? (
        <Empty>No bookings yet.</Empty>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <Card key={b.id}>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="font-semibold text-pj-slate-900">{b.service}</div>
                  <div className="text-sm text-pj-slate-500">
                    {b.counterparty_name}{b.address ? ` · ${b.address}` : ""}{b.total ? ` · $${b.total}` : ""}
                  </div>
                </div>
                <Badge color={b.status === "completed" ? "green" : b.status === "cancelled" ? "slate" : "blue"}>
                  {b.status.replace(/_/g, " ")}
                </Badge>
              </div>

              {/* progress */}
              <div className="flex items-center gap-1 mt-4">
                {FLOW.map((s, i) => {
                  const done = i <= FLOW.indexOf(b.status);
                  return <div key={s} className={`h-1.5 flex-1 rounded-full ${done ? "bg-pj-blue-600" : "bg-pj-slate-200"}`} />;
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                {b.payment_status === "paid" ? (
                  <Badge color="green">Paid</Badge>
                ) : b.total ? (
                  <Button size="sm" disabled={paying === b.id} onClick={() => pay(b)}>
                    {paying === b.id ? "Starting…" : `Pay $${b.total}`}
                  </Button>
                ) : null}
                {NEXT_LABEL[b.status] && (
                  <Button size="sm" variant="outline" disabled={busy === b.id} onClick={() => advance(b)}>
                    {busy === b.id ? "…" : NEXT_LABEL[b.status]}
                  </Button>
                )}
                {b.status === "completed" && (
                  <Button size="sm" variant="ghost" onClick={() => setReviewing(b)}>Leave a review</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {reviewing && <ReviewModal booking={reviewing} onClose={() => setReviewing(null)} />}
    </>
  );
}

function ReviewModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.postReview({ provider_id: booking.provider_id, booking_id: booking.id, rating, comment: comment || undefined });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-pj-slate-900">Rate your job</h3>
        <p className="text-sm text-pj-slate-500 mb-4">How was {booking.counterparty_name}?</p>
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} className={`text-3xl ${n <= rating ? "text-amber-400" : "text-pj-slate-200"}`}>★</button>
          ))}
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} className={inputClass} rows={3} placeholder="Share details of your experience…" />
        <div className="flex gap-2 mt-4">
          <Button className="flex-1" disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Submit review"}</Button>
          <Button variant="ghost" onClick={onClose}>Skip</Button>
        </div>
      </div>
    </div>
  );
}
