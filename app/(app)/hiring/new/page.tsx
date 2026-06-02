"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../../lib/api";
import { Card, PageHeader, Field, inputClass } from "../../../components/ui";
import Button from "../../../components/Button";

const REQS = ["Background ✓", "Uniform OK", "Own transport", "English+Shona", "Crowd-control exp."];

export default function NewRequestPage() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [headcount, setHeadcount] = useState(1);
  const [hours, setHours] = useState(8);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [site, setSite] = useState("");
  const [rate, setRate] = useState("4");
  const [reqs, setReqs] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggle = (r: string) => setReqs((c) => (c.includes(r) ? c.filter((x) => x !== r) : [...c, r]));

  const days = start && end ? Math.max(1, Math.round((+new Date(end) - +new Date(start)) / 86400000) + 1) : 1;
  const estimate = Math.round(headcount * hours * days * Number(rate || 0) * 1.08 * 100) / 100;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return setErr("Enter the role / skill needed.");
    setBusy(true);
    setErr(null);
    try {
      await api.createWorkforceRequest({
        role_skill: role,
        headcount,
        hours_per_day: hours,
        start_date: start || undefined,
        end_date: end || undefined,
        site: site || undefined,
        requirements: reqs,
        rate: Number(rate) || undefined,
      });
      router.push("/hiring");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not post request.");
      setBusy(false);
    }
  };

  const stepper = (label: string, val: number, set: (n: number) => void) => (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => set(Math.max(1, val - 1))} className="w-9 h-9 rounded-lg border border-pj-slate-200 text-lg">−</button>
        <span className="font-extrabold text-lg w-8 text-center">{val}</span>
        <button type="button" onClick={() => set(val + 1)} className="w-9 h-9 rounded-lg border border-pj-slate-200 text-lg">+</button>
      </div>
    </Field>
  );

  return (
    <div className="max-w-2xl">
      <PageHeader title="New workforce request" subtitle="Hire one freelancer or a whole team." />
      <Card>
        <form onSubmit={submit} className="space-y-5">
          <Field label="Role / skill"><input value={role} onChange={(e) => setRole(e.target.value)} className={inputClass} placeholder="Event security staff" /></Field>
          <div className="grid grid-cols-2 gap-4">
            {stepper("How many", headcount, setHeadcount)}
            {stepper("Hours / day", hours, setHours)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="From"><input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass} /></Field>
            <Field label="To"><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rate / hour ($)"><input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className={inputClass} /></Field>
            <Field label="Site"><input value={site} onChange={(e) => setSite(e.target.value)} className={inputClass} placeholder="HICC, Harare" /></Field>
          </div>
          <div>
            <span className="block text-sm font-semibold text-pj-slate-700 mb-2">Requirements</span>
            <div className="flex flex-wrap gap-2">
              {REQS.map((r) => (
                <button key={r} type="button" onClick={() => toggle(r)} className={`rounded-full px-4 py-1.5 text-sm font-medium border transition ${reqs.includes(r) ? "bg-pj-blue-600 border-pj-blue-600 text-white" : "bg-white border-pj-slate-200 text-pj-slate-600"}`}>{r}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-pj-slate-50 px-4 py-3">
            <span className="text-sm text-pj-slate-500">Estimated cost (incl. 8% fee)</span>
            <span className="text-xl font-extrabold text-pj-slate-900">${estimate}</span>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Posting…" : "Post to verified pool"}</Button>
        </form>
      </Card>
    </div>
  );
}
