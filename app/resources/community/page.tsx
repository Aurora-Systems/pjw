"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function CommunityPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 bg-pj-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-pj-blue-900/5 border border-pj-slate-100">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-6">
              Our Community
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-pj-slate-900 mb-6 tracking-tight">
              PocketJobs Community Hub
            </h1>
            <p className="text-lg text-pj-slate-600 leading-relaxed mb-6">
              Connect with fellow tradespeople, freelancers, and businesses. Share tips on managing clients, improving service quality, and unlocking corporate gigs.
            </p>
            <p className="text-lg text-pj-slate-600 leading-relaxed mb-8">
              We host monthly virtual workshops and community roundtables covering digital banking, micro-insurance options, tax compliance, and business scaling for self-employed professionals.
            </p>

            <div className="p-6 rounded-2xl bg-pj-slate-50 border border-pj-slate-100 space-y-6">
              <div>
                <h3 className="font-bold text-pj-slate-900 text-base mb-1">🛡️ Safe Space Vetting</h3>
                <p className="text-pj-slate-500 text-sm leading-relaxed">
                  All community members must hold active verified badges. This guarantees high-trust constructive feedback and clean professional exchanges.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-pj-slate-900 text-base mb-1">📢 Upcoming Roundtables</h3>
                <p className="text-pj-slate-500 text-sm leading-relaxed">
                  Join our upcoming session: &ldquo;Micro-saving & Digital Banking for Self-Employed Trades in Zimbabwe&rdquo; — June 15, 2026.
                </p>
              </div>
            </div>

            <div className="text-center mt-10">
              <button
                onClick={() => alert("Registration for Hub (UI placeholder)")}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-pj-blue-600 text-white font-semibold hover:bg-pj-blue-700 transition-colors cursor-pointer"
              >
                Join Community Hub Forum
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
