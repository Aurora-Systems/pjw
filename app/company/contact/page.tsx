"use client";

import { useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Button from "../../components/Button";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Message sent by: ${name} (${email})\n(This is a UI placeholder)`);
    setName("");
    setEmail("");
    setMessage("");
  };

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
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-semibold text-pj-slate-700 mb-2">
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-pj-slate-200 text-pj-slate-900 placeholder:text-pj-slate-400 focus:outline-none focus:ring-2 focus:ring-pj-blue-500 focus:border-pj-blue-500 transition-all duration-200"
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-pj-slate-200 text-pj-slate-900 placeholder:text-pj-slate-400 focus:outline-none focus:ring-2 focus:ring-pj-blue-500 focus:border-pj-blue-500 transition-all duration-200"
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
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-pj-slate-200 text-pj-slate-900 placeholder:text-pj-slate-400 focus:outline-none focus:ring-2 focus:ring-pj-blue-500 focus:border-pj-blue-500 transition-all duration-200"
                    placeholder="How can we help you?"
                  />
                </div>
                <Button type="submit" variant="primary" size="lg" className="w-full">
                  Send Message
                </Button>
              </form>

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
