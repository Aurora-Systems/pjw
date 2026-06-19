"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Button from "./components/Button";

/* ─── Scroll animation observer ─── */
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    const elements = ref.current?.querySelectorAll(".animate-on-scroll");
    elements?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ─── Data ─── */
const categories = [
  {
    name: "Home & Property Services",
    icon: (
      <svg className="w-6 h-6 text-pj-blue-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    name: "Moving & Delivery Services",
    icon: (
      <svg className="w-6 h-6 text-pj-blue-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
  {
    name: "Family & Personal Care Services",
    icon: (
      <svg className="w-6 h-6 text-pj-blue-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    ),
  },
  {
    name: "Education & Professional Services",
    icon: (
      <svg className="w-6 h-6 text-pj-blue-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.57 50.57 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M12 21v-8.25" />
      </svg>
    ),
  },
  {
    name: "Creative & Digital Services",
    icon: (
      <svg className="w-6 h-6 text-pj-blue-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25" />
      </svg>
    ),
  },
  {
    name: "Events & Entertainment Services",
    icon: (
      <svg className="w-6 h-6 text-pj-blue-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-1.81-5.096L2.1 14.1 7.2 13.2l.813-5.096L9.813 13.1l5.096.9-5.096.904zM19.007 6.007L18.5 8.5l-.507-2.493L15.5 5.5l2.493-.507L18.5 2.5l.507 2.493L21.5 5.5l-2.493.507z" />
      </svg>
    ),
  },
  {
    name: "Automotive Services",
    icon: (
      <svg className="w-6 h-6 text-pj-blue-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM18.75 18.75a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM3.75 12h16.5M4.5 12l1.637-4.912a1.5 1.5 0 0 1 1.423-1.025h8.88a1.5 1.5 0 0 1 1.423 1.025L19.5 12M3 15.75h18" />
      </svg>
    ),
  },
  {
    name: "Labour & Construction Services",
    icon: (
      <svg className="w-6 h-6 text-pj-blue-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A1.24 1.24 0 1 0 19 19.25l-5.83-5.83M11.42 15.17a3 3 0 1 1-4.24-4.24 3 3 0 0 1 4.24 4.24ZM3.75 6.75h16.5M3.75 12h16.5M12 12V3" />
      </svg>
    ),
  },
  {
    name: "Health, Wellness & Fitness",
    icon: (
      <svg className="w-6 h-6 text-pj-blue-600 group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0Z" />
      </svg>
    ),
  },
];

const steps = [
  {
    number: "01",
    title: "Post Your Job",
    description:
      "Describe what you need. It's free to post and takes just minutes to get your project started.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Review Proposals",
    description:
      "Receive proposals from top-rated freelancers within hours. Compare profiles, reviews, and portfolios.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Hire & Collaborate",
    description:
      "Select your ideal match, collaborate in real-time, and pay securely through our protected platform.",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
  },
];

const features = [
  {
    title: "Verified Freelancers",
    description: "Every freelancer goes through our rigorous vetting process for quality assurance.",
  },
  {
    title: "Secure Payments",
    description: "Pay your provider directly in cash on completion — no platform fees on your job.",
  },
  {
    title: "24/7 Support",
    description: "Our dedicated support team is available around the clock to help you.",
  },
  {
    title: "AI-Powered Matching",
    description: "Smart algorithms connect you with the perfect talent for your specific needs.",
  },
  {
    title: "Real-Time Collaboration",
    description: "Built-in chat, file sharing, and project tracking tools keep everyone aligned.",
  },
  {
    title: "Local Talent Pool",
    description: "Connect with verified tradespeople, freelancers, and laborers across Zimbabwe and Africa.",
  },
];

/* ─── Testimonials (real 5-star reviews) ─── */
type Testimonial = {
  comment: string;
  rating: number;
  reviewer_first_name: string | null;
  provider_name: string | null;
  primary_category: string | null;
};

function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  useEffect(() => {
    fetch("/api/testimonials")
      .then((r) => (r.ok ? r.json() : { testimonials: [] }))
      .then((d) => setItems(d.testimonials || []))
      .catch(() => setItems([]));
  }, []);

  // Honest fallback: render nothing until there are real reviews to show.
  if (items.length === 0) return null;

  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-pj-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-4">
            Loved by customers
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pj-slate-900 text-balance">
            Real reviews from real jobs
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-pj-slate-100 flex flex-col">
              <div className="text-amber-400 mb-3">{"★".repeat(t.rating)}</div>
              <p className="text-pj-slate-600 leading-relaxed flex-1">&ldquo;{t.comment}&rdquo;</p>
              <div className="mt-5 pt-4 border-t border-pj-slate-100">
                <div className="font-semibold text-pj-slate-900">{t.reviewer_first_name || "A customer"}</div>
                <div className="text-sm text-pj-slate-500">
                  {t.provider_name ? `Hired ${t.provider_name}` : "Verified booking"}
                  {t.primary_category ? ` · ${t.primary_category}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Page Component ─── */
export default function Home() {
  const pageRef = useScrollAnimation();

  return (
    <div ref={pageRef} className="flex flex-col min-h-full">
      <Navbar />

      {/* ══════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════ */}
      <section
        id="hero"
        className="relative pt-28 pb-20 lg:pt-40 lg:pb-32 overflow-hidden"
      >
        {/* Background video */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
          poster="https://cdn.pocketjobs.co/web_assets/17773.jpg"
        >
          <source
            src="https://cdn.pocketjobs.co/web_assets/286884_tiny.mp4"
            type="video/mp4"
          />
        </video>
        {/* Light scrim — mostly clear through the middle so the video shows */}
        <div className="absolute inset-0 bg-gradient-to-b from-pj-slate-900/40 via-pj-slate-900/15 to-pj-slate-900/50" />

        {/* Floating decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-pj-blue-200/30 rounded-full blur-3xl animate-float" />
          <div className="absolute top-40 right-[15%] w-96 h-96 bg-pj-sky-400/20 rounded-full blur-3xl animate-float-delay" />
          <div className="absolute bottom-10 left-[30%] w-64 h-64 bg-pj-blue-100/40 rounded-full blur-3xl animate-float-slow" />
          {/* Geometric shapes */}
          <div className="absolute top-32 right-[25%] w-16 h-16 border-2 border-pj-blue-200/40 rounded-2xl rotate-12 animate-float" />
          <div className="absolute top-60 left-[20%] w-10 h-10 border-2 border-pj-blue-300/30 rounded-full animate-float-delay" />
          <div className="absolute bottom-32 right-[10%] w-12 h-12 bg-pj-blue-100/50 rounded-xl rotate-45 animate-float-slow" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pj-blue-50 border border-pj-blue-100 mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-pj-blue-500 animate-pulse-soft" />
              <span className="text-sm font-medium text-pj-blue-700">
                Built in Zimbabwe for Africa&apos;s workforce
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 animate-fade-in text-balance drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)]">
              Find the right talent.{" "}
              <span className="gradient-text">Right in your pocket.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in text-balance drop-shadow-[0_1px_10px_rgba(0,0,0,0.7)]">
              Connect with top freelancers worldwide. Post a job, review
              proposals, and hire the perfect match, all from one powerful
              platform.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto animate-fade-in-up">
              <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white rounded-2xl shadow-xl shadow-pj-blue-900/5 border border-pj-slate-100">
                <div className="flex-1 relative">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pj-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder='Try "Plumber", "Solar Installer", or "Graphic Designer"'
                    className="w-full pl-12 pr-4 py-3.5 text-base text-pj-slate-900 placeholder:text-pj-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0"
                    id="hero-search-input"
                  />
                </div>
                <Button
                  variant="primary"
                  size="lg"
                  className="sm:w-auto whitespace-nowrap"
                  id="hero-search-btn"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  Find Talent
                </Button>
              </div>

              {/* Popular searches */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="text-white/70">Popular:</span>
                {["Solar Installers", "Plumbing", "Home Cleaners", "Catering", "Carpentry", "Event Security"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-white border border-pj-slate-200 text-pj-slate-600 hover:border-pj-blue-300 hover:text-pj-blue-600 hover:bg-pj-blue-50 cursor-pointer transition-all duration-200"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════
          HOW IT WORKS
          ══════════════════════════════════════════ */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="animate-on-scroll inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-4">
              Simple Process
            </span>
            <h2 className="animate-on-scroll text-3xl sm:text-4xl lg:text-5xl font-bold text-pj-slate-900 mb-4 text-balance">
              How PocketJobs Works
            </h2>
            <p className="animate-on-scroll text-lg text-pj-slate-500 max-w-2xl mx-auto">
              Get your project done in three simple steps. It&apos;s fast, easy,
              and designed to connect you with the right talent.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className={`animate-on-scroll stagger-${i + 1} group relative bg-white rounded-2xl p-8 border border-pj-slate-100 hover:border-pj-blue-200 hover:shadow-xl hover:shadow-pj-blue-900/5 transition-all duration-300`}
              >
                {/* Step number */}
                <span className="absolute top-6 right-6 text-5xl font-black text-pj-blue-50 group-hover:text-pj-blue-100 transition-colors duration-300">
                  {step.number}
                </span>
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-pj-blue-50 text-pj-blue-600 flex items-center justify-center mb-6 group-hover:bg-pj-blue-600 group-hover:text-white transition-all duration-300">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-pj-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-pj-slate-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          POPULAR CATEGORIES
          ══════════════════════════════════════════ */}
      <section id="categories" className="py-20 lg:py-28 bg-pj-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <span className="animate-on-scroll inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-4">
                Browse Work
              </span>
              <h2 className="animate-on-scroll text-3xl sm:text-4xl lg:text-5xl font-bold text-pj-slate-900 text-balance">
                Popular Categories
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {categories.map((cat, i) => (
              <div
                key={cat.name}
                className={`animate-on-scroll stagger-${i + 1} group bg-white rounded-3xl p-6 border border-pj-slate-100 hover:border-pj-blue-200 cursor-pointer hover:shadow-xl hover:shadow-pj-blue-900/5 hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="w-12 h-12 rounded-2xl bg-pj-blue-50 flex items-center justify-center mb-5 group-hover:bg-pj-blue-600 group-hover:scale-110 transition-all duration-300">
                  {cat.icon}
                </div>
                <h3 className="font-bold text-pj-slate-900 text-[15px] leading-snug mb-1.5 group-hover:text-pj-blue-600 transition-colors">
                  {cat.name}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHY POCKETJOBS
          ══════════════════════════════════════════ */}
      <section id="why-pocketjobs" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Feature list */}
            <div>
              <span className="animate-on-scroll inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-4">
                Why Choose Us
              </span>
              <h2 className="animate-on-scroll text-3xl sm:text-4xl lg:text-5xl font-bold text-pj-slate-900 mb-6 text-balance">
                Everything you need to scale your team
              </h2>
              <p className="animate-on-scroll text-lg text-pj-slate-500 mb-10 max-w-lg">
                PocketJobs gives you all the tools to find, hire, and manage
                world-class freelance talent, securely and efficiently.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                {features.map((feat, i) => (
                  <div
                    key={feat.title}
                    className={`animate-on-scroll stagger-${i + 1} flex gap-3`}
                  >
                    <div className="w-6 h-6 rounded-full bg-pj-blue-100 text-pj-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-pj-slate-900 text-sm mb-1">
                        {feat.title}
                      </h4>
                      <p className="text-sm text-pj-slate-500 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Photo collage */}
            <div className="animate-on-scroll relative">
              {/* eslint-disable @next/next/no-img-element */}
              <div className="grid grid-cols-2 grid-rows-2 gap-4 h-[440px] lg:h-[520px]">
                <div className="row-span-2 relative rounded-3xl overflow-hidden shadow-xl shadow-pj-blue-900/10">
                  <img
                    src="https://cdn.pocketjobs.co/web_assets/17773.jpg"
                    alt="A PocketJobs service provider at work"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-pj-blue-900/10">
                  <img
                    src="https://cdn.pocketjobs.co/web_assets/2064.jpg"
                    alt="A skilled tradesperson on PocketJobs"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-pj-blue-900/10">
                  <img
                    src="https://cdn.pocketjobs.co/web_assets/97145.jpg"
                    alt="A freelancer collaborating through PocketJobs"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              {/* eslint-enable @next/next/no-img-element */}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS (real 5-star reviews)
          ══════════════════════════════════════════ */}
      <Testimonials />

      {/* ══════════════════════════════════════════
          CTA BANNER
          ══════════════════════════════════════════ */}
      <section id="cta" className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-on-scroll relative bg-gradient-to-br from-pj-blue-600 via-pj-blue-700 to-pj-blue-900 rounded-3xl px-8 py-16 lg:px-16 lg:py-20 text-center overflow-hidden">
            {/* Decorative shapes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full" />
            </div>

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance">
                Ready to get started?
              </h2>
              <p className="text-lg text-blue-200 max-w-xl mx-auto mb-10">
                Join thousands of businesses and freelancers who are already
                building the future of work on PocketJobs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="secondary"
                  size="lg"
                  href="/signup"
                  className="bg-white text-pj-blue-700 hover:bg-blue-50 hover:text-pj-blue-800 shadow-lg"
                  id="cta-hire-btn"
                >
                  Hire Talent
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  href="/signup"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                  id="cta-find-work-btn"
                >
                  Find Work
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
