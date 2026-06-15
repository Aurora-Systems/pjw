"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setToken } from "../../lib/api";
import { Spinner } from "../../components/ui";

/** Landing page after Google OAuth — reads the token from the URL fragment, stores it, continues. */
export default function AuthCompletePage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = hash.get("token");
    if (token) {
      setToken(token);
      router.replace("/dashboard");
    } else {
      setError(true);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-pj-slate-600">
      {error ? (
        <>
          <p>Sign-in didn&apos;t complete.</p>
          <a href="/login" className="text-pj-blue-600 font-semibold">Back to login</a>
        </>
      ) : (
        <>
          <Spinner className="h-8 w-8" />
          <p>Signing you in…</p>
        </>
      )}
    </div>
  );
}
