"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "../../../lib/api";
import { Card, Badge, Stat, Loading, Field, inputClass } from "../../../components/ui";
import Button from "../../../components/Button";
import type { ProviderDetail, ProviderService, Review } from "../../../lib/types";

export default function ProviderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [portfolio, setPortfolio] = useState<string[]>([]);

  const [service, setService] = useState("");
  const [when, setWhen] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState("card");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.provider(id).then(({ provider, services, reviews, portfolio }) => {
      setProvider(provider);
      setServices(services);
      setReviews(reviews);
      setPortfolio(portfolio ?? []);
      setService(services[0]?.title || provider.primary_category || "Service");
    });
  }, [id]);

  if (!provider) return <Loading />;

  const book = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await api.createBooking({
        provider_id: id,
        service,
        scheduled_at: when || undefined,
        address: address || undefined,
        notes: notes || undefined,
        total: provider.hourly_rate ? Number(provider.hourly_rate) : undefined,
        payment_method: payment,
      });
      setMsg("Booking confirmed!");
      setTimeout(() => router.push("/bookings"), 800);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not book.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-pj-blue-600 text-white flex items-center justify-center text-xl font-bold">
            {provider.full_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-pj-slate-900 flex items-center gap-2">
              {provider.full_name}
              {provider.id_verified && <span className="text-pj-blue-600 text-lg">✓</span>}
            </h1>
            <p className="text-pj-slate-500">{provider.headline}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <Stat value={provider.rating ?? "—"} label="Rating" />
          <Stat value={provider.jobs_count} label="Jobs" />
          <Stat value={`${provider.on_time_pct}%`} label="On-time" />
          <Stat value={`$${provider.hourly_rate ?? "—"}`} label="Hourly" />
        </div>

        <h2 className="text-lg font-bold text-pj-slate-900 mb-2">About</h2>
        <p className="text-pj-slate-600 leading-relaxed mb-3">{provider.bio}</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {provider.background_checked && <Badge color="green">Background ✓</Badge>}
          {provider.license_verified && <Badge>License ✓</Badge>}
          {provider.is_top_rated && <Badge color="amber">Top rated</Badge>}
        </div>

        {services.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-pj-slate-900 mb-2">Services &amp; rates</h2>
            <Card className="mb-6 p-0 overflow-hidden">
              {services.map((s, i) => (
                <div key={s.id} className={`flex justify-between px-5 py-3 ${i > 0 ? "border-t border-pj-slate-100" : ""}`}>
                  <span className="font-medium text-pj-slate-800">{s.title}</span>
                  <span className="text-pj-slate-500">
                    ${s.rate}{s.rate_type === "hourly" ? "/hr" : s.rate_type === "min" ? " min" : " fixed"}
                  </span>
                </div>
              ))}
            </Card>
          </>
        )}

        {portfolio.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-pj-slate-900 mb-2">Portfolio</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
              {portfolio.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />
              ))}
            </div>
          </>
        )}

        <h2 className="text-lg font-bold text-pj-slate-900 mb-2">Reviews ({provider.reviews_count})</h2>
        <div className="space-y-3">
          {reviews.length === 0 && <p className="text-pj-slate-500">No reviews yet.</p>}
          {reviews.map((r) => (
            <Card key={r.id}>
              <div className="flex justify-between">
                <strong className="text-pj-slate-900">{r.reviewer_name}</strong>
                <span className="text-amber-500 text-sm font-semibold">★ {r.rating}.0</span>
              </div>
              <p className="text-pj-slate-600 mt-1">{r.comment}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Booking panel */}
      <div>
        <Card className="lg:sticky lg:top-24">
          <h3 className="font-bold text-pj-slate-900 mb-1">Book {provider.full_name.split(" ")[0]}</h3>
          <p className="text-sm text-pj-slate-500 mb-4">From ${provider.hourly_rate}/hr</p>
          <form onSubmit={book} className="space-y-4">
            <Field label="Service"><input value={service} onChange={(e) => setService(e.target.value)} className={inputClass} /></Field>
            <Field label="When"><input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass} /></Field>
            <Field label="Address"><input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="14 Rolf Ave, Avondale" /></Field>
            <Field label="Notes"><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} rows={2} /></Field>
            <Field label="Payment">
              <select value={payment} onChange={(e) => setPayment(e.target.value)} className={inputClass}>
                <option value="card">Card</option>
                <option value="ecocash">EcoCash</option>
                <option value="cash">Cash on completion</option>
              </select>
            </Field>
            {err && <p className="text-sm text-red-600">{err}</p>}
            {msg && <p className="text-sm text-emerald-600">{msg}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Booking…" : "Confirm booking"}</Button>
            <p className="text-xs text-pj-slate-400 text-center">🔒 Funds held in escrow until the job is complete.</p>
          </form>
        </Card>
      </div>
    </div>
  );
}
