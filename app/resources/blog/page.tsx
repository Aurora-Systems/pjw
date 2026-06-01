"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function BlogPage() {
  const posts = [
    {
      title: "5 Tips to Get Hired Faster as a Service Provider",
      date: "May 28, 2026",
      excerpt:
        "Learn how completing your identity checks, uploading high-quality photos of your carpentry or paint work, and collecting early client reviews doubles your hire rate.",
    },
    {
      title: "Vetting Guide: How PocketJobs Keeps Your Family Safe",
      date: "May 24, 2026",
      excerpt:
        "An inside look at our verification pipelines: national identity checks, mobile phone registration validation, and community guidelines moderation.",
    },
    {
      title: "Zimbabwe Gig Economy Trends in 2026",
      date: "May 15, 2026",
      excerpt:
        "A deep dive into how digital labor matching increases economic mobility, reduces transactional friction, and empowers informal trades across Africa.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 bg-pj-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-pj-blue-900/5 border border-pj-slate-100">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-6">
              Official Blog
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-pj-slate-900 mb-6 tracking-tight">
              PocketJobs Blog
            </h1>
            <p className="text-lg text-pj-slate-600 leading-relaxed mb-10">
              Insights, gig work tips, marketplace security updates, and news straight from the team building PocketJobs.
            </p>

            <div className="space-y-8">
              {posts.map((post) => (
                <div
                  key={post.title}
                  className="p-6 rounded-2xl border border-pj-slate-100 bg-pj-slate-50/50 hover:bg-white hover:border-pj-blue-200 transition-all duration-300"
                >
                  <div className="text-xs font-bold text-pj-blue-600 mb-2">{post.date}</div>
                  <h3 className="text-xl font-bold text-pj-slate-900 mb-2">{post.title}</h3>
                  <p className="text-pj-slate-600 text-[15px] leading-relaxed mb-4">{post.excerpt}</p>
                  <button
                    onClick={() => alert("Blog reading placeholder (UI only)")}
                    className="text-sm font-bold text-pj-blue-600 hover:text-pj-blue-700 transition-colors cursor-pointer"
                  >
                    Read article →
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
