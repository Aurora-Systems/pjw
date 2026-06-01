"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function LeadershipPage() {
  const leaders = [
    {
      name: "Tinashe Muronda",
      role: "Co-Founder & CEO",
      bio: "Visionary entrepreneur with a passion for building platforms that empower local workforces and digitize African gig economies.",
      avatar: "TM",
    },
    {
      name: "Sarah Moyo",
      role: "Chief Operating Officer",
      bio: "Operations specialist ensuring provider verification pipelines, compliance, customer support, and local logistics run seamlessly.",
      avatar: "SM",
    },
    {
      name: "Farai Chigumba",
      role: "Head of Product Engineering",
      bio: "Software architect leading developer teams to construct secure, high-performance web and location-based mobile systems.",
      avatar: "FC",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 bg-pj-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-pj-blue-900/5 border border-pj-slate-100">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-6">
              Our Team
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-pj-slate-900 mb-6 tracking-tight">
              Leadership at PocketJobs
            </h1>
            <p className="text-lg text-pj-slate-600 leading-relaxed mb-10">
              Meet the management team steering PocketJobs toward creating Africa&apos;s most accessible, review-driven, and highly-trusted labor marketplace.
            </p>

            <div className="space-y-8">
              {leaders.map((leader) => (
                <div
                  key={leader.name}
                  className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl border border-pj-slate-100 bg-pj-slate-50/50 hover:border-pj-blue-200 hover:bg-white transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-full bg-pj-blue-600 text-white font-bold flex items-center justify-center text-xl flex-shrink-0">
                    {leader.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-pj-slate-900">{leader.name}</h3>
                    <div className="text-pj-blue-600 font-semibold text-sm mb-2">{leader.role}</div>
                    <p className="text-pj-slate-600 text-[15px] leading-relaxed">{leader.bio}</p>
                  </div>
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
