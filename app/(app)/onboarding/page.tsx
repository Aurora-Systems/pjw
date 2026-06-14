"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { Card, PageHeader, Field, inputClass, Loading } from "../../components/ui";
import Button from "../../components/Button";
import type { Category } from "../../lib/types";

interface DraftService {
  title: string;
  rate: string;
  rate_type: "hourly" | "fixed" | "min";
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [headline, setHeadline] = useState("");
  const [experience, setExperience] = useState("");
  const [rate, setRate] = useState("");
  const [city, setCity] = useState("Harare");
  const [bio, setBio] = useState("");
  const [services, setServices] = useState<DraftService[]>([{ title: "", rate: "", rate_type: "hourly" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.categories().then((c) => setCategories(c.categories));
  }, []);

  // Customers/corporates/admins don't onboard here; already-onboarded providers skip it.
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (user.role !== "provider" || user.provider_onboarded) router.replace("/dashboard");
  }, [loading, user, router]);

  if (loading || !user) return <Loading />;

  const setService = (i: number, patch: Partial<DraftService>) =>
    setServices((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const addRow = () => setServices((s) => [...s, { title: "", rate: "", rate_type: "hourly" }]);
  const removeRow = (i: number) => setServices((s) => s.filter((_, idx) => idx !== i));

  const submit = async () => {
    setError(null);
    if (!category) return setError("Choose your main trade / category.");
    if (!headline.trim()) return setError("Add a short headline.");
    const valid = services.filter((s) => s.title.trim() && s.rate);
    if (valid.length === 0) return setError("Add at least one service with a price.");

    setBusy(true);
    try {
      for (const s of valid) {
        await api.addService({ category, title: s.title.trim(), rate: Number(s.rate), rate_type: s.rate_type });
      }
      await api.updateProviderProfile({
        primary_category: category,
        headline: headline.trim(),
        bio: bio.trim() || undefined,
        years_experience: experience ? Number(experience) : undefined,
        hourly_rate: rate ? Number(rate) : Number(valid[0].rate),
        city: city.trim() || undefined,
        available: true,
        onboarded: true,
      });
      await refresh();
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Set up your provider profile"
        subtitle={`Welcome, ${user.full_name.split(" ")[0]}. Tell customers what you do so you can start getting jobs.`}
      />
      <Card>
        <div className="space-y-5">
          <Field label="Main trade / category">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Headline">
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputClass} placeholder="Licensed plumber - Harare - 6 yrs" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Years experience">
              <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Base rate ($/hr)">
              <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className={inputClass} />
            </Field>
          </div>
          <Field label="Area / city">
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
          </Field>
          <Field label="About you (optional)">
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className={inputClass} rows={3} />
          </Field>
        </div>

        <h2 className="text-lg font-bold text-pj-slate-900 mt-6 mb-1">Services &amp; rates</h2>
        <p className="text-sm text-pj-slate-500 mb-3">Add the jobs you take on and what you charge.</p>
        <div className="space-y-3">
          {services.map((s, i) => (
            <div key={i} className="rounded-xl border border-pj-slate-200 p-3 grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 sm:col-span-6">
                <Field label="Service">
                  <input value={s.title} onChange={(e) => setService(i, { title: e.target.value })} className={inputClass} placeholder="e.g. Geyser install" />
                </Field>
              </div>
              <div className="col-span-6 sm:col-span-3">
                <Field label="Price ($)">
                  <input type="number" value={s.rate} onChange={(e) => setService(i, { rate: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <div className="col-span-4 sm:col-span-2">
                <Field label="Type">
                  <select value={s.rate_type} onChange={(e) => setService(i, { rate_type: e.target.value as DraftService["rate_type"] })} className={inputClass}>
                    <option value="hourly">/hr</option>
                    <option value="fixed">fixed</option>
                    <option value="min">min</option>
                  </select>
                </Field>
              </div>
              <div className="col-span-2 sm:col-span-1">
                {services.length > 1 && (
                  <button onClick={() => removeRow(i)} className="w-full h-[46px] rounded-xl text-red-600 hover:bg-red-50 font-bold">×</button>
                )}
              </div>
            </div>
          ))}
          <button onClick={addRow} className="text-sm font-semibold text-pj-blue-600 hover:text-pj-blue-700">+ Add another service</button>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
        <Button className="w-full mt-6" disabled={busy} onClick={submit}>
          {busy ? "Saving…" : "Finish & start getting jobs"}
        </Button>
      </Card>
    </div>
  );
}
