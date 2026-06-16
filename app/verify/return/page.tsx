import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verification submitted · PocketJobs",
  robots: { index: false, follow: false },
};

/**
 * Landing page Didit redirects to after a provider completes identity verification.
 * The mobile app opens Didit in an in-app browser, so this just confirms the
 * submission and tells the provider to return to the app and tap "Check status".
 */
export default function VerifyReturnPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pj-slate-50 px-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 md:p-10 text-center shadow-xl shadow-pj-blue-900/5 border border-pj-slate-100">
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-pj-slate-900 mb-2">Verification submitted</h1>
        <p className="text-pj-slate-600 leading-relaxed mb-6">
          Thanks — your identity details have been submitted to our verification partner.
          You can now close this window, return to the <span className="font-semibold text-pj-slate-900">PocketJobs</span> app,
          and tap <span className="font-semibold text-pj-slate-900">&ldquo;Check status&rdquo;</span> to refresh your verification.
        </p>
        <p className="text-sm text-pj-slate-400">
          Reviews are usually completed within a few minutes.
        </p>
      </div>
    </div>
  );
}
