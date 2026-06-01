"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function SupportPage() {
  const faqs = [
    {
      q: "How do I onboard as a service provider?",
      a: "Download the PocketJobs Mobile App (for workers), create your profile, upload your national ID, and select your service category. Our vetting team will verify your details within 48 hours to grant your badge.",
    },
    {
      q: "Is there a fee to post jobs on PocketJobs?",
      a: "Posting standard jobs is completely free for individual customers and households. Featured jobs or promoted listings incur small placement fees.",
    },
    {
      q: "How do payments work?",
      a: "Our upcoming Neon DB and stripe/mobile money backend will feature protected escrow payments. Customers fund the project milestone, and funds are only disbursed once you confirm the work is completed correctly.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 bg-pj-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-pj-blue-900/5 border border-pj-slate-100">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-6">
              FAQ & Help
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-pj-slate-900 mb-6 tracking-tight">
              Help & Support
            </h1>
            <p className="text-lg text-pj-slate-600 leading-relaxed mb-8">
              Find answers to frequently asked questions, guidelines for service providers, and information on how we vet professionals to keep our ecosystem secure.
            </p>

            <h2 className="text-2xl font-bold text-pj-slate-900 mb-6 mt-10">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div
                  key={faq.q}
                  className="p-6 rounded-2xl border border-pj-slate-100 bg-pj-slate-50/50 hover:bg-white transition-all duration-300"
                >
                  <h3 className="text-lg font-bold text-pj-slate-900 mb-2">{faq.q}</h3>
                  <p className="text-pj-slate-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-2xl bg-pj-blue-50 border border-pj-blue-100 mt-10 text-center">
              <h3 className="text-lg font-bold text-pj-blue-800 mb-2">Need direct assistance?</h3>
              <p className="text-pj-slate-600 text-sm mb-4">
                Our customer support team is available 24 hours a day, 7 days a week to handle dispute reports or onboarding help.
              </p>
              <a
                href="mailto:support@pocketjobs.co"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-pj-blue-600 text-white font-semibold text-sm hover:bg-pj-blue-700 transition-colors cursor-pointer"
              >
                Email support@pocketjobs.co
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
