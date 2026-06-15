"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { uploadFile } from "../../lib/upload";
import { Card, PageHeader, Field, inputClass, Loading } from "../../components/ui";
import Button from "../../components/Button";
import type { SavedAddress } from "../../lib/types";

export default function AccountPage() {
  const { user, loading, refresh } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.addresses().then(({ addresses }) => setAddresses(addresses)).catch(() => undefined);
  }, []);

  if (loading || !user) return <Loading />;

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const { url } = await uploadFile(f, "avatar");
    await api.updateAccount({ avatar_url: url });
    await refresh();
    setMsg("Photo updated.");
  };

  const add = async () => {
    if (!address.trim()) return;
    setBusy(true);
    try {
      const { address: saved } = await api.addAddress({ label: label || undefined, address: address.trim() });
      setAddresses((a) => [saved, ...a]);
      setLabel("");
      setAddress("");
    } finally {
      setBusy(false);
    }
  };
  const remove = async (id: string) => {
    await api.deleteAddress(id);
    setAddresses((a) => a.filter((x) => x.id !== id));
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Account" subtitle="Your profile and saved addresses." />
      {msg && <p className="text-sm text-emerald-600 mb-4">{msg}</p>}

      <Card className="mb-6 flex items-center gap-4">
        <button onClick={() => avatarInput.current?.click()} className="relative w-16 h-16 rounded-full bg-pj-blue-600 text-white flex items-center justify-center text-xl font-bold overflow-hidden">
          {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : user.full_name.slice(0, 2).toUpperCase()}
          <span className="absolute bottom-0 right-0 bg-pj-blue-700 text-[10px] px-1 rounded">edit</span>
        </button>
        <input ref={avatarInput} type="file" accept="image/*" hidden onChange={onAvatar} />
        <div>
          <div className="font-bold text-pj-slate-900">{user.full_name}</div>
          <div className="text-sm text-pj-slate-500">{user.email}</div>
        </div>
      </Card>

      <h2 className="text-lg font-bold text-pj-slate-900 mb-3">Saved addresses</h2>
      <Card className="mb-4 space-y-3">
        <Field label="Label (e.g. Home)"><input value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} /></Field>
        <Field label="Address"><input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="14 Rolf Ave, Avondale" /></Field>
        <Button onClick={add} disabled={busy || !address.trim()}>{busy ? "Saving…" : "Save address"}</Button>
      </Card>
      {addresses.length === 0 ? (
        <p className="text-sm text-pj-slate-500">No saved addresses yet.</p>
      ) : (
        <div className="space-y-2">
          {addresses.map((a) => (
            <Card key={a.id} className="flex items-center justify-between">
              <div>
                {a.label && <div className="font-semibold text-pj-slate-900">{a.label}</div>}
                <div className="text-sm text-pj-slate-500">{a.address}</div>
              </div>
              <button onClick={() => remove(a.id)} className="text-red-600 font-bold px-2">×</button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
