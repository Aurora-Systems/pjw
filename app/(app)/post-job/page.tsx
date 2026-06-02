"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../lib/api";
import { Card, PageHeader, Field, inputClass } from "../../components/ui";
import Button from "../../components/Button";
import type { Category } from "../../lib/types";

export default function PostJobPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>();
  const [description, setDescription] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [when, setWhen] = useState("This week");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.categories().then((c) => setCategories(c.categories));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!title) return setErr("Add a job title.");
    setBusy(true);
    try {
      const { job } = await api.postJob({
        title,
        category,
        description: description || undefined,
        budget_min: min ? Number(min) : undefined,
        budget_max: max ? Number(max) : undefined,
        when_text: when,
        location: location || undefined,
      });
      router.push(`/jobs/${job.id}`);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not post job.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Post a job" subtitle="Describe what you need — nearby pros will bid." />
      <Card>
        <form onSubmit={submit} className="space-y-5">
          <Field label="Job title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Fix leaking kitchen tap" /></Field>
          <div>
            <span className="block text-sm font-semibold text-pj-slate-700 mb-2">Category</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategory(category === c.slug ? undefined : c.slug)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium border transition ${category === c.slug ? "bg-pj-blue-600 border-pj-blue-600 text-white" : "bg-white border-pj-slate-200 text-pj-slate-600"}`}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={4} placeholder="Kitchen mixer tap leaks at the base. Probably needs a new cartridge." /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Budget min ($)"><input type="number" value={min} onChange={(e) => setMin(e.target.value)} className={inputClass} /></Field>
            <Field label="Budget max ($)"><input type="number" value={max} onChange={(e) => setMax(e.target.value)} className={inputClass} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="When"><input value={when} onChange={(e) => setWhen(e.target.value)} className={inputClass} /></Field>
            <Field label="Location"><input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClass} placeholder="Avondale" /></Field>
          </div>
          <div className="rounded-xl bg-pj-blue-50 text-pj-slate-700 text-sm px-4 py-3">
            ℹ️ Your job will be sent to up to 15 nearby pros. Expect first bids in ~10 minutes.
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Posting…" : "Post job"}</Button>
        </form>
      </Card>
    </div>
  );
}
