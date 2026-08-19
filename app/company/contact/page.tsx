"use client";

import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Button from "../../components/Button";

/**
 * Contact form. This used to `alert()` and throw the message away; it now posts to
 * POST /api/enquiries, which lands the submission in the admin enquiry inbox.
 *
 * The three states are deliberately distinct: while "sending" the button is disabled so a
 * double-tap can't create two enquiries; "sent" swaps the form for a confirmation (the
 * fields are cleared, so leaving the form up would look like nothing happened); "error"
 * keeps everything the person typed on screen and tells them it failed. A failure must
 * never look like a success — someone who thinks they've reached us and hasn't is worse
 * off than someone who knows to email support directly.
 */
export default function ContactPage() {
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
          subject: "Contact form",
          source: "web",
        }),
      });

      // The API answers `{ error }` on failure; fall back to the status code when the
      // body isn't JSON at all (proxy error page, offline shell, ...).
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
          : "We couldn't send your message. Please check your connection and try again."
      );
    }
  };

  const sending = status === "sending";

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 bg-pj-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-pj-blue-900/5 border border-pj-slate-100">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-6">
              Get in Touch
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-pj-slate-900 mb-6 tracking-tight">
              Contact Us
            </h1>
            <p className="text-lg text-pj-slate-600 leading-relaxed mb-8">
              Do you have questions about onboarding as a service provider, corporate partnerships, or technical integration? Reach out and we&apos;ll be in touch.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
              {/* Form */}
              {status === "sent" ? (
                <div
                  role="status"
                  className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200"
                >
                  <h2 className="text-lg font-bold text-emerald-900 mb-2">
                    Thanks — we&apos;ve got your message.
                  </h2>
                  <p className="text-emerald-800 text-sm leading-relaxed mb-5">
                    Our support team reads every enquiry and replies by email, usually
                    within 24 hours.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => setStatus("idle")}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-semibold text-pj-slate-700 mb-2">
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      disabled={sending}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-pj-slate-200 text-pj-slate-900 placeholder:text-pj-slate-400 focus:outline-none focus:ring-2 focus:ring-pj-blue-500 focus:border-pj-blue-500 transition-all duration-200 disabled:opacity-60"
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-semibold text-pj-slate-700 mb-2">
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      disabled={sending}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-pj-slate-200 text-pj-slate-900 placeholder:text-pj-slate-400 focus:outline-none focus:ring-2 focus:ring-pj-blue-500 focus:border-pj-blue-500 transition-all duration-200 disabled:opacity-60"
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-semibold text-pj-slate-700 mb-2">
                      Your Message
                    </label>
                    <textarea
                      id="contact-message"
                      required
                      rows={4}
                      disabled={sending}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-pj-slate-200 text-pj-slate-900 placeholder:text-pj-slate-400 focus:outline-none focus:ring-2 focus:ring-pj-blue-500 focus:border-pj-blue-500 transition-all duration-200 disabled:opacity-60"
                      placeholder="How can we help you?"
                    />
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
                    >
                      <span className="font-semibold">Message not sent.</span> {error}{" "}
                      You can also email us at{" "}
                      <a href="mailto:support@pocketjobs.co" className="font-semibold underline">
                        support@pocketjobs.co
                      </a>
                      .
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={sending}
                  >
                    {sending ? "Sending…" : "Send Message"}
                  </Button>
                </form>
              )}

              {/* Sidebar info */}
              <div className="space-y-6 p-6 rounded-2xl bg-pj-slate-50 border border-pj-slate-100">
                <div>
                  <h3 className="font-bold text-pj-slate-900 text-base mb-1">Corporate Headquarters</h3>
                  <p className="text-pj-slate-500 text-sm leading-relaxed">
                    PocketJobs HQ<br />
                    Harare CBD<br />
                    Zimbabwe
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-pj-slate-900 text-base mb-1">Support Email</h3>
                  <a href="mailto:support@pocketjobs.co" className="text-pj-blue-600 text-sm font-semibold hover:underline">
                    support@pocketjobs.co
                  </a>
                </div>
                <div>
                  <h3 className="font-bold text-pj-slate-900 text-base mb-1">Response Time</h3>
                  <p className="text-pj-slate-500 text-sm leading-relaxed">
                    Our standard support team responds to all incoming queries within 24 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
