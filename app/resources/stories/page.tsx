"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function StoriesPage() {
  const stories = [
    {
      title: "How Chipo Built a Gardening Agency in Harare",
      body: "Chipo registered as a solo landscaper on PocketJobs. After receiving multiple 5-star reviews from residential clients, demand soared. He hired four assistant gardeners and now handles event landscaping contracts through our platform.",
      author: "Chipo M., Harare",
    },
    {
      title: "Techflow Solved a Critical Backend Bug Overnight",
      body: "Techflow, a local financial software consultancy, needed an immediate PostgreSQL tuning specialist. They posted a quick gig and onboarded Farai within 3 hours. Farai resolved their connection bottlenecks before the morning deployment.",
      author: "Sarah C., CTO at Techflow",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 bg-pj-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-pj-blue-900/5 border border-pj-slate-100">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-6">
              Success Stories
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-pj-slate-900 mb-6 tracking-tight">
              Customer & Provider Success Stories
            </h1>
            <p className="text-lg text-pj-slate-600 leading-relaxed mb-10">
              Read how local tradespeople, household gig workers, and Zimbabwean startups use PocketJobs to discover clients and execute premium projects.
            </p>

            <div className="space-y-8">
              {stories.map((story) => (
                <div
                  key={story.title}
                  className="p-6 rounded-2xl border border-pj-slate-100 bg-pj-slate-50/50 hover:bg-white hover:border-pj-blue-200 transition-all duration-300"
                >
                  <h3 className="text-xl font-bold text-pj-slate-900 mb-2">{story.title}</h3>
                  <p className="text-pj-slate-600 text-[15px] leading-relaxed mb-4">{story.body}</p>
                  <div className="text-sm font-bold text-pj-blue-600">— {story.author}</div>
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
