"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-xl font-bold text-pj-slate-900">Something went wrong</h1>
      <p className="mt-2 text-pj-slate-500">An unexpected error occurred. Please try again.</p>
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center rounded-full bg-pj-blue-600 px-5 py-2.5 text-white font-semibold hover:bg-pj-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
