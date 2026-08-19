"use client";

import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Button from "../../components/Button";

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
      a: "Customers pay providers directly in cash when the job is done — PocketJobs takes no cut of your job. Providers keep a small prepaid balance with us (topped up via EcoCash/card) from which a 10% platform commission is deducted each time they take a job.",
    },
  ];

  // The page was FAQ + a mailto link only, so anyone whose question wasn't in the list had
  // to leave the site to ask it. This form posts to POST /api/enquiries so the question
  // lands in the admin inbox instead. The mailto stays as the fallback we point at when a
  // submission fails — never leave someone with a dead end.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
          subject: "Support request",
          source: "web",
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          (data && typeof data.error === "string" && data.error) ||
            `Something went wrong (${res.status}).`
        );
      }

      setName("");
      setEmail("");
      setMessage("");
      setStatus("sent");
    } catch (err) {
      setStatus("idle");
      setError(
        err instanceof Error && err.message
          ? err.message
          : "We couldn't send your request. Please check your connection and try again."
      );
    }
  };

  const sending = status === "sending";
  const inputClasses =
    "w-full px-4 py-3 rounded-xl border border-pj-slate-200 bg-white text-pj-slate-900 placeholder:text-pj-slate-400 focus:outline-none focus:ring-2 focus:ring-pj-blue-500 focus:border-pj-blue-500 transition-all duration-200 disabled:opacity-60";

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

            {/* Still need help? — goes straight to the support inbox. */}
            <div className="p-6 md:p-8 rounded-2xl bg-pj-blue-50 border border-pj-blue-100 mt-10">
              {status === "sent" ? (
                <div role="status" className="text-center">
                  <h3 className="text-lg font-bold text-pj-blue-800 mb-2">
                    Request received — thank you.
                  </h3>
                  <p className="text-pj-slate-600 text-sm mb-5">
                    Our support team will reply to you by email, usually within 24 hours.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setStatus("idle")}
                  >
                    Ask something else
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-pj-blue-800 mb-2">Still need help?</h3>
                  <p className="text-pj-slate-600 text-sm mb-6">
                    Didn&apos;t find your answer above? Send our support team the details and
                    we&apos;ll get back to you by email — we&apos;re available 24/7 for dispute
                    reports and onboarding help.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="support-name" className="block text-sm font-semibold text-pj-slate-700 mb-2">
                          Your Name
                        </label>
                        <input
                          id="support-name"
                          type="text"
                          required
                          disabled={sending}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={inputClasses}
                          placeholder="Enter name"
                        />
                      </div>
                      <div>
                        <label htmlFor="support-email" className="block text-sm font-semibold text-pj-slate-700 mb-2">
                          Email Address
                        </label>
                        <input
                          id="support-email"
                          type="email"
                          required
                          disabled={sending}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={inputClasses}
                          placeholder="Enter email"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="support-message" className="block text-sm font-semibold text-pj-slate-700 mb-2">
                        How can we help?
                      </label>
                      <textarea
                        id="support-message"
                        required
                        rows={4}
                        disabled={sending}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={inputClasses}
                        placeholder="Describe your issue — include your job or booking reference if you have one."
                      />
                    </div>

                    {error && (
                      <div
                        role="alert"
                        className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
                      >
                        <span className="font-semibold">Request not sent.</span> {error}{" "}
                        You can also email us at{" "}
                        <a href="mailto:support@pocketjobs.co" className="font-semibold underline">
                          support@pocketjobs.co
                        </a>
                        .
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 pt-1">
                      <Button type="submit" variant="primary" size="lg" disabled={sending}>
                        {sending ? "Sending…" : "Send request"}
                      </Button>
                      <a
                        href="mailto:support@pocketjobs.co"
                        className="text-pj-blue-600 text-sm font-semibold hover:underline"
                      >
                        Or email support@pocketjobs.co
                      </a>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
