"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { Card, Badge, PageHeader, Loading, Empty, Field, inputClass } from "../../components/ui";
import Button from "../../components/Button";
import type { CorporateProfile, WorkforceRequest } from "../../lib/types";

export default function HiringPage() {
  const [profile, setProfile] = useState<CorporateProfile | null>(null);
  const [requests, setRequests] = useState<WorkforceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKyc, setShowKyc] = useState(false);

  const load = async () => {
    const [p, r] = await Promise.all([api.corporateProfile(), api.workforceRequests()]);
    setProfile(p.profile);
    setRequests(r.requests);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  if (loading || !profile) return <Loading />;
  const isCompany = profile.account_type === "company";

  return (
    <>
      <PageHeader
        title="Hiring"
        subtitle={isCompany ? "Your company's workforce requests." : "Your freelancer & workforce requests."}
        action={<Button href="/hiring/new">New request</Button>}
      />

      {/* account banner */}
      {isCompany ? (
        profile.verification_status !== "verified" && (
          <Card className="mb-6 bg-pj-blue-50 border-0 flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-pj-slate-900">Complete company verification</div>
              <div className="text-sm text-pj-slate-500">
                Status: {profile.verification_status} — unlock 30-day invoicing &amp; an account manager.
              </div>
            </div>
            <Button size="sm" onClick={() => setShowKyc(true)}>Verify</Button>
          </Card>
        )
      ) : (
        <Card className="mb-6 bg-pj-blue-50 border-0 flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-pj-slate-900">Hiring as an individual</div>
            <div className="text-sm text-pj-slate-500">Post jobs freely. Need invoicing for a business? Register as a company.</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowKyc(true)}>Register a company</Button>
        </Card>
      )}

      {requests.length === 0 ? (
        <Empty>No requests yet. Post your first one.</Empty>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {requests.map((r) => (
            <Card key={r.id}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-pj-slate-900">{r.role_skill}</div>
                  <div className="text-sm text-pj-slate-500">{r.headcount} staff · {r.hours_per_day}h/day{r.site ? ` · ${r.site}` : ""}</div>
                  {r.start_date && <div className="text-sm text-pj-slate-400">{r.start_date?.slice(0, 10)}{r.end_date ? ` → ${r.end_date.slice(0, 10)}` : ""}</div>}
                </div>
                <div className="text-right">
                  <Badge>{r.status}</Badge>
                  <div className="font-bold text-pj-slate-900 mt-2">${r.estimated_cost ?? "—"}</div>
                </div>
              </div>
              {r.requirements && r.requirements.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {r.requirements.map((req) => <Badge key={req} color="slate">{req}</Badge>)}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {showKyc && <KycModal profile={profile} onClose={() => setShowKyc(false)} onDone={() => { setShowKyc(false); load(); }} />}
    </>
  );
}

function KycModal({ profile, onClose, onDone }: { profile: CorporateProfile; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(profile.company_name ?? "");
  const [reg, setReg] = useState(profile.company_reg_no ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!name) return setErr("Enter your company name.");
    setBusy(true);
    setErr(null);
    try {
      await api.updateCorporateProfile({ company_name: name, company_reg_no: reg || undefined, account_type: "company", submit_kyc: true });
      onDone();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not submit.");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-pj-slate-900">Company details</h3>
        <p className="text-sm text-pj-slate-500 mb-4">Used for invoicing, billing &amp; priority support.</p>
        <div className="space-y-4">
          <Field label="Company name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Skyline Holdings (Pvt) Ltd" /></Field>
          <Field label="Registration no."><input value={reg} onChange={(e) => setReg(e.target.value)} className={inputClass} placeholder="10421/2018" /></Field>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex gap-2">
            <Button className="flex-1" disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Submit for verification"}</Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
