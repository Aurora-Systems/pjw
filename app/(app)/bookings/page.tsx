"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { uploadFile } from "../../lib/upload";
import { Card, Badge, PageHeader, Loading, Empty, inputClass } from "../../components/ui";
import Button from "../../components/Button";
import MapView from "../../components/MapView";
import type { Booking, BookingStatus } from "../../lib/types";

const FLOW: BookingStatus[] = ["confirmed", "on_the_way", "arrived", "in_progress", "completed"];
const TRACKABLE = ["confirmed", "on_the_way", "arrived", "in_progress"];
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

              {TRACKABLE.includes(b.status) && b.provider_lat != null && b.provider_lng != null && (
                <div className="mt-3">
                  <MapView
                    height={200}
                    center={{ lat: Number(b.provider_lat), lng: Number(b.provider_lng) }}
                    markers={[
                      { id: "pro", lat: Number(b.provider_lat), lng: Number(b.provider_lng), title: `${b.counterparty_name} is here` },
                      ...(b.lat != null && b.lng != null
                        ? [{ id: "you", lat: Number(b.lat), lng: Number(b.lng), title: "Your location" }]
                        : []),
                    ]}
                  />
                </div>
              )}

              {/* progress */}
              <div className="flex items-center gap-1 mt-4">
                {FLOW.map((s, i) => {
                  const done = i <= FLOW.indexOf(b.status);
                  return <div key={s} className={`h-1.5 flex-1 rounded-full ${done ? "bg-pj-blue-600" : "bg-pj-slate-200"}`} />;
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                {b.total ? <Badge color="slate">💵 Pay ${b.total} in cash</Badge> : null}
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
  const [photos, setPhotos] = useState<string[]>([]);
  const photoInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState<string | null>(null);

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoErr(null);
    try {
      const { url } = await uploadFile(f, "review");
      setPhotos((p) => [...p, url]);
    } catch (err) {
      setPhotoErr(err instanceof Error ? err.message : "Could not upload photo.");
    } finally {
      e.target.value = "";
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      await api.postReview({ provider_id: booking.provider_id, booking_id: booking.id, rating, comment: comment || undefined, photos: photos.length ? photos : undefined });
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
        <div className="flex flex-wrap gap-2 mt-3">
          {photos.map((url, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${url})` }}>
              <button onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs">×</button>
            </div>
          ))}
          <button onClick={() => photoInput.current?.click()} className="w-16 h-16 rounded-lg border border-dashed border-pj-slate-300 text-pj-slate-400 text-xl">+</button>
          <input ref={photoInput} type="file" accept="image/*" hidden onChange={onPhoto} />
        </div>
        {photoErr && <p className="text-sm text-red-600 mt-2">{photoErr}</p>}
        <div className="flex gap-2 mt-4">
          <Button className="flex-1" disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Submit review"}</Button>
          <Button variant="ghost" onClick={onClose}>Skip</Button>
        </div>
      </div>
    </div>
  );
}
