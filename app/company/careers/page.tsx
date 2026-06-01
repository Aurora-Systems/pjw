"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function CareersPage() {
  const openings = [
    {
      title: "Mobile App Engineer (React Native / Flutter)",
      location: "Harare, Zimbabwe / Remote",
      type: "Full-Time",
      description:
        "Build location-aware mobile applications allowing customers and informal service providers to book gigs, track status, and coordinate in real-time.",
    },
    {
      title: "Backend Platform Engineer",
      location: "Harare, Zimbabwe / Hybrid",
      type: "Full-Time",
      description:
        "Architect server structures and Neon DB models using secure auth frameworks, geofencing queries, and multi-channel notification engines.",
    },
    {
      title: "Community & Provider Vetting Manager",
      location: "Bulawayo, Zimbabwe / Hybrid",
      type: "Full-Time",
      description:
        "Oversee the onboarding, verification, identity checks, and badge award workflows for thousands of local trade, home, and personal care providers.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 bg-pj-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-pj-blue-900/5 border border-pj-slate-100">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-6">
              Join Us
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-pj-slate-900 mb-6 tracking-tight">
              Careers at PocketJobs
            </h1>
            <p className="text-lg text-pj-slate-600 leading-relaxed mb-10">
              Work on products that matter. PocketJobs is creating livelihoods and offering dignity to thousands of skilled labor, trades, and freelance experts across Zimbabwe.
            </p>

            <h2 className="text-2xl font-bold text-pj-slate-900 mb-6">Open Roles</h2>
            <div className="space-y-6">
              {openings.map((job) => (
                <div
                  key={job.title}
                  className="p-6 rounded-2xl border border-pj-slate-100 hover:border-pj-blue-200 bg-pj-slate-50/50 hover:bg-white transition-all duration-300"
                >
                  <div className="flex justify-between items-start gap-4 flex-wrap mb-2">
                    <h3 className="text-xl font-bold text-pj-slate-900">{job.title}</h3>
                    <span className="px-3 py-1 rounded-full bg-pj-blue-50 text-pj-blue-700 text-xs font-bold border border-pj-blue-100 whitespace-nowrap">
                      {job.type}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-pj-slate-500 mb-3">{job.location}</div>
                  <p className="text-pj-slate-600 text-[15px] leading-relaxed mb-4">{job.description}</p>
                  <button
                    onClick={() => alert(`Applied for ${job.title}! (UI placeholder)`)}
                    className="text-sm font-bold text-pj-blue-600 hover:text-pj-blue-700 transition-colors cursor-pointer"
                  >
                    Apply for this role →
                  </button>
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
