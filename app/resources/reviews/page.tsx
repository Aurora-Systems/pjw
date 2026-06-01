"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function ReviewsPage() {
  const reviews = [
    {
      name: "Tinashe C.",
      rating: 5,
      date: "May 25, 2026",
      text: "The plumbing repairs were handled fast and professionally. Finding verified workers in Bulawayo has never been this simple.",
    },
    {
      name: "Rufaro M.",
      rating: 5,
      date: "May 20, 2026",
      text: "Our corporate event security and catering teams were booked entirely through PocketJobs event services. The team delivered flawless execution.",
    },
    {
      name: "Kelvin T.",
      rating: 5,
      date: "May 18, 2026",
      text: "Mobile car wash was scheduled in minutes. Having providers verify themselves beforehand gives immense peace of mind.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 bg-pj-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-pj-blue-900/5 border border-pj-slate-100">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-6">
              Reviews
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-pj-slate-900 mb-6 tracking-tight">
              Community Reviews
            </h1>
            <p className="text-lg text-pj-slate-600 leading-relaxed mb-10">
              PocketJobs is built on a foundation of trust. Read verified reviews from clients who have hired experts for home, professional, event, and labor services.
            </p>

            <div className="space-y-6">
              {reviews.map((rev, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-pj-slate-100 bg-pj-slate-50/50 hover:bg-white hover:border-pj-blue-200 transition-all duration-300"
                >
                  <div className="flex justify-between items-center gap-4 mb-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-pj-slate-900 text-base">{rev.name}</div>
                      <div className="flex gap-0.5 text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, j) => (
                          <span key={j}>★</span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-pj-slate-400">{rev.date}</div>
                  </div>
                  <p className="text-pj-slate-600 text-[15px] leading-relaxed italic">
                    &ldquo;{rev.text}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
