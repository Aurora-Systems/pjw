"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { Card, Badge, PageHeader, Loading, Field, inputClass } from "../../components/ui";
import Button from "../../components/Button";
import type { Booking, ProviderBlock } from "../../lib/types";

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  x.setHours(0, 0, 0, 0);
  return x;
}
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SchedulePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selected, setSelected] = useState(() => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<ProviderBlock[]>([]);
  const [busy, setBusy] = useState(true);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  useEffect(() => {
    if (!loading && user && user.role !== "provider") router.replace("/dashboard");
  }, [loading, user, router]);

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart]);
  const load = () => {
    setBusy(true);
    Promise.all([api.bookings(), api.providerBlocks(weekStart.toISOString(), weekEnd.toISOString())]).then(([b, bl]) => {
      setBookings(b.bookings);
      setBlocks(bl.blocks);
      setBusy(false);
    });
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (user?.role === "provider") load(); }, [weekStart, user?.role]);

  if (loading || !user || user.role !== "provider") return <Loading />;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dayBookings = (d: Date) => bookings.filter((b) => b.scheduled_at && sameDay(new Date(b.scheduled_at), d));
  const dayBlocks = (d: Date) => blocks.filter((bl) => sameDay(new Date(bl.start_at), d));
  const fmt = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const addBlock = async () => {
    if (!start || !end) return;
    const { block } = await api.addBlock({ start_at: new Date(start).toISOString(), end_at: new Date(end).toISOString(), reason: "Blocked" });
    setBlocks((b) => [...b, block]);
    setStart(""); setEnd("");
  };
  const removeBlock = async (id: string) => { await api.deleteBlock(id); setBlocks((b) => b.filter((x) => x.id !== id)); };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Schedule" subtitle="Your booked jobs and blocked time." />
      <div className="flex items-center justify-between mb-3">
        <Button size="sm" variant="ghost" onClick={() => setWeekStart(addDays(weekStart, -7))}>‹ Prev</Button>
        <span className="font-semibold text-pj-slate-700">{weekStart.toLocaleDateString([], { month: "long", year: "numeric" })}</span>
        <Button size="sm" variant="ghost" onClick={() => setWeekStart(addDays(weekStart, 7))}>Next ›</Button>
      </div>
      <div className="grid grid-cols-7 gap-2 mb-6">
        {days.map((d, i) => {
          const sel = sameDay(d, selected);
          const n = dayBookings(d).length + dayBlocks(d).length;
          return (
            <button key={i} onClick={() => setSelected(d)} className={`rounded-xl py-2 ${sel ? "bg-pj-blue-600 text-white" : "bg-white border border-pj-slate-200 text-pj-slate-700"}`}>
              <div className="text-[11px] opacity-80">{DOW[i]}</div>
              <div className="font-extrabold">{d.getDate()}</div>
              <div className="h-1.5">{n > 0 && <span className={`inline-block w-1.5 h-1.5 rounded-full ${sel ? "bg-white" : "bg-pj-blue-600"}`} />}</div>
            </button>
          );
        })}
      </div>

      <h2 className="text-lg font-bold text-pj-slate-900 mb-2">{selected.toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" })}</h2>
      {busy ? (
        <Loading />
      ) : (
        <div className="space-y-3 mb-6">
          {dayBookings(selected).length === 0 && dayBlocks(selected).length === 0 && (
            <p className="text-pj-slate-500">Nothing scheduled this day.</p>
          )}
          {dayBookings(selected).map((b) => (
            <Card key={b.id} className="flex items-center justify-between cursor-default">
              <div>
                <div className="font-semibold text-pj-slate-900">{b.service}</div>
                <div className="text-sm text-pj-slate-500">{b.scheduled_at ? fmt(b.scheduled_at) : ""} · {b.counterparty_name}</div>
              </div>
              <Badge>{b.status.replace(/_/g, " ")}</Badge>
            </Card>
          ))}
          {dayBlocks(selected).map((bl) => (
            <Card key={bl.id} className="flex items-center justify-between bg-pj-slate-50">
              <div>
                <div className="font-semibold text-pj-slate-900">Blocked</div>
                <div className="text-sm text-pj-slate-500">{fmt(bl.start_at)} – {fmt(bl.end_at)}</div>
              </div>
              <button onClick={() => removeBlock(bl.id)} className="text-red-600 font-bold px-2">×</button>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <strong className="text-pj-slate-900">Block off time</strong>
        <div className="grid sm:grid-cols-3 gap-3 mt-3 items-end">
          <Field label="From"><input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} /></Field>
          <Field label="To"><input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} /></Field>
          <Button onClick={addBlock} disabled={!start || !end}>Block time</Button>
        </div>
      </Card>
    </div>
  );
}
