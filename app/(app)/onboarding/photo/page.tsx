"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";
import { uploadFile } from "../../../lib/upload";
import { Card, Loading } from "../../../components/ui";
import Button from "../../../components/Button";

/**
 * Required profile-photo step. The (app) Shell redirects any signed-in non-admin user
 * without an avatar here, so a photo is mandatory before using the app.
 */
export default function PhotoOnboardingPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | undefined>(user?.avatar_url ?? undefined);

  if (loading || !user) return <Loading />;

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(null);
    setBusy(true);
    try {
      const { url } = await uploadFile(f, "avatar");
      await api.updateAccount({ avatar_url: url });
      setPreview(url);
      await refresh();
      router.push("/dashboard"); // Shell re-routes to the right place now that there's a photo
    } catch (uploadErr) {
      setErr(uploadErr instanceof Error ? uploadErr.message : "Could not upload photo. Please try again.");
      setBusy(false);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card className="text-center">
        <h1 className="text-2xl font-extrabold text-pj-slate-900 mb-1">Add a profile photo</h1>
        <p className="text-pj-slate-500 mb-6">
          A clear photo builds trust with the people you work with. It&apos;s required to continue.
        </p>

        <button
          onClick={() => fileInput.current?.click()}
          disabled={busy}
          className="mx-auto mb-6 w-32 h-32 rounded-full overflow-hidden bg-pj-slate-100 flex items-center justify-center text-pj-blue-600 text-4xl font-bold"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="w-full h-full object-cover" />
          ) : (
            user.full_name.slice(0, 2).toUpperCase()
          )}
        </button>
        <input ref={fileInput} type="file" accept="image/*" hidden onChange={onFile} />

        <Button className="w-full" disabled={busy} onClick={() => fileInput.current?.click()}>
          {busy ? "Uploading…" : "Choose a photo"}
        </Button>
        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
      </Card>
    </div>
  );
}
