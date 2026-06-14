"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { uploadFile } from "../../lib/upload";
import { Card, PageHeader, Badge, Loading, Field, inputClass } from "../../components/ui";
import Button from "../../components/Button";
import type { ProviderService } from "../../lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [portfolio, setPortfolio] = useState<{ id: string; url: string }[]>([]);
  const [vstatus, setVstatus] = useState("unverified");
  const [headline, setHeadline] = useState("");
  const [rate, setRate] = useState("");
  const [available, setAvailable] = useState(true);
  const [newSvc, setNewSvc] = useState({ title: "", rate: "", rate_type: "hourly" });
  const [msg, setMsg] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const portfolioInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && user && user.role !== "provider") router.replace("/dashboard");
  }, [loading, user, router]);

  const loadAll = () => {
    api.providerProfile().then(({ profile, services }) => {
      setProfile(profile);
      setServices(services);
      setHeadline((profile.headline as string) ?? "");
      setRate((profile.hourly_rate as string) ?? "");
      setAvailable(Boolean(profile.available));
    });
    api.portfolio().then(({ portfolio }) => setPortfolio(portfolio));
    api.verificationStatus().then((s) => setVstatus(s.id_verified ? "verified" : s.verification_status)).catch(() => {});
  };
  useEffect(() => {
    if (user?.role === "provider") loadAll();
  }, [user?.role]);

  if (loading || !user || user.role !== "provider" || !profile) return <Loading />;

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const { url } = await uploadFile(f, "avatar");
    await api.updateAccount({ avatar_url: url });
    await refresh();
    setMsg("Photo updated.");
  };
  const onPortfolio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const { id } = await uploadFile(f, "portfolio");
    await api.addPortfolio(id);
    api.portfolio().then(({ portfolio }) => setPortfolio(portfolio));
  };
  const save = async () => {
    await api.updateProviderProfile({ headline, hourly_rate: rate ? Number(rate) : undefined, available });
    setMsg("Profile saved.");
  };
  const addService = async () => {
    if (!newSvc.title || !newSvc.rate) return;
    await api.addService({ title: newSvc.title, rate: Number(newSvc.rate), rate_type: newSvc.rate_type });
    setNewSvc({ title: "", rate: "", rate_type: "hourly" });
    api.providerServices().then(({ services }) => setServices(services));
  };
  const removeService = async (id: string) => {
    await api.deleteService(id);
    setServices((s) => s.filter((x) => x.id !== id));
  };
  const verify = async () => {
    try {
      const { url } = await api.startVerification();
      window.open(url, "_blank");
      setVstatus("pending");
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Could not start verification.");
    }
  };
  const checkVerify = async () => {
    const s = await api.verificationStatus();
    setVstatus(s.id_verified ? "verified" : s.verification_status);
    await refresh();
  };

  const avatar = user.avatar_url || undefined;

  return (
    <div className="max-w-3xl">
      <PageHeader title="My profile" subtitle="Your public provider profile, portfolio and verification." />
      {msg && <p className="text-sm text-emerald-600 mb-4">{msg}</p>}

      <Card className="mb-5 flex items-center gap-4">
        <button onClick={() => avatarInput.current?.click()} className="relative w-16 h-16 rounded-full bg-pj-blue-600 text-white flex items-center justify-center text-xl font-bold overflow-hidden">
          {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : user.full_name.slice(0, 2).toUpperCase()}
          <span className="absolute bottom-0 right-0 bg-pj-blue-700 text-[10px] px-1 rounded">edit</span>
        </button>
        <input ref={avatarInput} type="file" accept="image/*" hidden onChange={onAvatar} />
        <div>
          <div className="font-bold text-pj-slate-900">{user.full_name}</div>
          <div className="text-sm text-pj-slate-500">{user.email}</div>
        </div>
      </Card>

      {/* Verification */}
      <Card className="mb-5">
        <div className="flex items-center justify-between">
          <strong className="text-pj-slate-900">Identity verification</strong>
          <Badge color={vstatus === "verified" ? "green" : vstatus === "pending" ? "amber" : vstatus === "rejected" ? "red" : "slate"}>{vstatus}</Badge>
        </div>
        {vstatus !== "verified" && (
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" onClick={verify}>{vstatus === "pending" ? "Continue verification" : "Verify identity"}</Button>
            {vstatus === "pending" && <Button size="sm" variant="outline" onClick={checkVerify}>Check status</Button>}
          </div>
        )}
      </Card>

      {/* Headline / rate / availability */}
      <Card className="mb-5 space-y-4">
        <Field label="Headline"><input value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputClass} /></Field>
        <Field label="Hourly rate ($)"><input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className={inputClass} /></Field>
        <label className="flex items-center gap-2 text-sm font-medium text-pj-slate-700">
          <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="h-4 w-4 rounded border-pj-slate-300 text-pj-blue-600" />
          Available for jobs
        </label>
        <Button onClick={save}>Save changes</Button>
      </Card>

      {/* Services */}
      <Card className="mb-5">
        <strong className="text-pj-slate-900">Services &amp; rates</strong>
        <div className="mt-3 space-y-2">
          {services.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-pj-slate-100 pb-2">
              <span className="font-medium text-pj-slate-800">{s.title}</span>
              <div className="flex items-center gap-3">
                <span className="text-pj-slate-500">${s.rate}{s.rate_type === "hourly" ? "/hr" : s.rate_type === "min" ? " min" : " fixed"}</span>
                <button onClick={() => removeService(s.id)} className="text-red-600 font-bold">×</button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-12 gap-2 items-end mt-3">
          <div className="col-span-6"><Field label="Service"><input value={newSvc.title} onChange={(e) => setNewSvc({ ...newSvc, title: e.target.value })} className={inputClass} /></Field></div>
          <div className="col-span-3"><Field label="Price"><input type="number" value={newSvc.rate} onChange={(e) => setNewSvc({ ...newSvc, rate: e.target.value })} className={inputClass} /></Field></div>
          <div className="col-span-2"><Field label="Type"><select value={newSvc.rate_type} onChange={(e) => setNewSvc({ ...newSvc, rate_type: e.target.value })} className={inputClass}><option value="hourly">/hr</option><option value="fixed">fixed</option><option value="min">min</option></select></Field></div>
          <div className="col-span-1"><button onClick={addService} className="w-full h-[46px] rounded-xl bg-pj-blue-50 text-pj-blue-700 font-bold">+</button></div>
        </div>
      </Card>

      {/* Portfolio */}
      <Card>
        <div className="flex items-center justify-between">
          <strong className="text-pj-slate-900">Portfolio</strong>
          <Button size="sm" variant="outline" onClick={() => portfolioInput.current?.click()}>Add photo</Button>
          <input ref={portfolioInput} type="file" accept="image/*" hidden onChange={onPortfolio} />
        </div>
        {portfolio.length === 0 ? (
          <p className="text-sm text-pj-slate-500 mt-2">Add photos of your work to win more customers.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
            {portfolio.map((p) => (
              <div key={p.id} className="relative aspect-square rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${p.url})` }}>
                <button onClick={async () => { await api.deletePortfolio(p.id); setPortfolio((x) => x.filter((y) => y.id !== p.id)); }} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/55 text-white text-xs">×</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
