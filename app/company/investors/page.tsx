"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function InvestorsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 bg-pj-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-pj-blue-900/5 border border-pj-slate-100">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-6">
              Financial Growth
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-pj-slate-900 mb-6 tracking-tight">
              Investor Relations
            </h1>
            <p className="text-lg text-pj-slate-600 leading-relaxed mb-6">
              PocketJobs is positioned as a high-growth tech platform digitizing gig work and local commerce in developing markets. We are constructing the digital pipes of employment infrastructure across Africa, starting with a scalable rollout in Zimbabwe.
            </p>
            <p className="text-lg text-pj-slate-600 leading-relaxed mb-8">
              By combining high-trust verification loops, location-based service engines, and seamless payment structures, PocketJobs drives friction out of the market for both formal businesses and the massive informal labor sector.
            </p>

            <div className="p-6 rounded-2xl bg-pj-blue-50 border border-pj-blue-100 mb-8">
              <h3 className="text-lg font-bold text-pj-blue-800 mb-2">Our Market Opportunity</h3>
              <p className="text-pj-slate-600 text-sm leading-relaxed">
                Over 80% of African labor is informal. PocketJobs provides a standardized ecosystem offering secure payments, reputational profiles, and automated matching. Our subscription fees, commission structures, and verification badge system yield highly resilient marketplace unit economics.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-pj-slate-900 mb-4">Contact Investor Relations</h2>
            <p className="text-pj-slate-600 leading-relaxed mb-6">
              If you are interested in our venture funding rounds or partnership models, please contact our corporate development team.
            </p>
            <a
              href="mailto:investors@pocketjobs.co"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-pj-blue-600 text-white font-semibold hover:bg-pj-blue-700 transition-colors cursor-pointer"
            >
              Contact investors@pocketjobs.co
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
