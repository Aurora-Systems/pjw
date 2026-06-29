"use client";

import { useEffect, useRef } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Button from "../../components/Button";

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
    const els = ref.current?.querySelectorAll(".animate-on-scroll");
    els?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return ref;
}

const CDN = "https://cdn.pocketjobs.co/web_assets";

/* ─── Who we serve ─── */
const audiences = [
  {
    title: "Households & Individuals",
    line: "Book a trusted cleaner, plumber, tutor, or handyperson for your home — no haggling, no guesswork.",
    image: "2223.jpg",
    alt: "A service provider helping with a task at a home",
  },
  {
    title: "Businesses & Corporates",
    line: "Source vetted teams and on-demand labour for offices, projects, and events at the scale you need.",
    image: "2149345518.jpg",
    alt: "Professionals collaborating on a business project",
  },
  {
    title: "Skilled Workers & Freelancers",
    line: "Build a verified profile, get discovered nearby, and turn your skills into steady work opportunities.",
    image: "2064.jpg",
    alt: "A skilled tradesperson at work on a job",
  },
];

/* ─── Values / trust ─── */
const values = [
  {
    title: "Verified Providers",
    description:
      "Every worker is vetted, so you know exactly who you're inviting into your home or business.",
    image: "134917.jpg",
    alt: "A verified worker carrying out a service job",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
  },
  {
    title: "Location-Aware Discovery",
    description:
      "Find the right help nearby. PocketJobs matches you with providers in your area — fast.",
    image: "20668.jpg",
    alt: "A worker travelling to a nearby job",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
  },
  {
    title: "Transparent Reviews",
    description:
      "Real ratings from real jobs. Read honest feedback before you hire and book with confidence.",
    image: "2150990731.jpg",
    alt: "A satisfied customer after a completed job",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
  },
  {
    title: "Cash on Completion",
    description:
      "Pay your provider directly once the work is done. No platform fees on your job, no surprises.",
    image: "17773.jpg",
    alt: "A handover between a customer and a provider after a job",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
      </svg>
    ),
  },
];

/* ─── Stats band ─── */
const stats = [
  { value: "Zimbabwe", label: "Headquarters" },
  { value: "5+ Months", label: "In Development" },
  { value: "9 Sectors", label: "Service Categories" },
  { value: "Verified", label: "Provider Profiles" },
];

/* ─── Page Component ─── */
export default function AboutPage() {
  const pageRef = useScrollAnimation();

  return (
    <div ref={pageRef} className="flex flex-col min-h-screen bg-white">
      <Navbar />

      {/* eslint-disable @next/next/no-img-element */}

      {/* ══════════════════════════════════════════
          HERO — headline + intro + 2x2 collage
          ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white pt-28 lg:pt-40 pb-16 lg:pb-24">
        {/* Soft floating background accents */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-20 w-[28rem] h-[28rem] bg-pj-blue-50 rounded-full blur-3xl opacity-70" />
          <div className="absolute top-40 -left-24 w-80 h-80 bg-pj-sky-400/10 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-0 left-[40%] w-64 h-64 bg-pj-blue-100/40 rounded-full blur-3xl animate-float" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Copy */}
            <div>
              <span className="animate-fade-in inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-6">
                About PocketJobs
              </span>
              <h1 className="animate-fade-in text-4xl sm:text-5xl lg:text-6xl font-extrabold text-pj-slate-900 tracking-tight leading-[1.06] mb-6 text-balance">
                Work made simple.{" "}
                <span className="gradient-text">Opportunities made possible.</span>
              </h1>
              <p className="animate-fade-in-up text-lg text-pj-slate-600 leading-relaxed mb-6 max-w-xl">
                PocketJobs is an innovative hybrid digital marketplace and gig
                economy platform that connects individuals, households,
                businesses, event organizers, and corporate clients with verified
                service providers, skilled workers, informal laborers,
                freelancers, and tradespeople in Zimbabwe and across Africa.
              </p>
              <p className="animate-fade-in-up text-base text-pj-slate-500 leading-relaxed mb-8 max-w-xl">
                Need cleaning for your home, a developer for your website, or
                roadside assistance for your vehicle? We bring the right experts
                straight to your pocket.
              </p>
              <div className="animate-fade-in-up flex flex-col sm:flex-row gap-3">
                <Button variant="primary" size="lg" href="/signup" id="about-hero-cta">
                  Get started
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Button>
                <Button variant="outline" size="lg" href="/browse" id="about-hero-browse">
                  Explore services
                </Button>
              </div>
            </div>

            {/* 2x2 image collage (incl. the portrait) */}
            <div className="animate-fade-in-up relative">
              <div className="grid grid-cols-2 gap-4 sm:gap-5">
                <div className="space-y-4 sm:space-y-5 pt-8">
                  <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-pj-blue-900/10 aspect-[3/2]">
                    <img
                      src={`${CDN}/2223.jpg`}
                      alt="A service provider on a job in the community"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-pj-blue-900/10 aspect-[3/2]">
                    <img
                      src={`${CDN}/2064.jpg`}
                      alt="A skilled tradesperson at work"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="space-y-4 sm:space-y-5">
                  <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-pj-blue-900/10 aspect-[2/3]">
                    <img
                      src={`${CDN}/97145.jpg`}
                      alt="A worker delivering a hands-on service"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-pj-blue-900/10 aspect-[3/2]">
                    <img
                      src={`${CDN}/2149345518.jpg`}
                      alt="Professionals collaborating on a project"
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
              {/* Floating accent badge */}
              <div className="hidden sm:flex glass-solid absolute -bottom-5 -left-4 lg:left-4 items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl shadow-pj-blue-900/10 border border-pj-slate-100 animate-float">
                <div className="w-10 h-10 rounded-xl bg-pj-blue-600 text-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-pj-slate-900">Verified providers</div>
                  <div className="text-xs text-pj-slate-500">Trusted across Africa</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MISSION + VISION — bento pair
          ══════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 bg-pj-slate-50 border-y border-pj-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
            {/* Mission card */}
            <div className="animate-on-scroll group bg-white rounded-[2rem] overflow-hidden border border-pj-slate-100 shadow-xl shadow-pj-blue-900/5 flex flex-col">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={`${CDN}/134917.jpg`}
                  alt="A PocketJobs provider carrying out a job"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pj-slate-900/30 to-transparent" />
              </div>
              <div className="p-8 lg:p-10 flex flex-col flex-1">
                <span className="inline-block w-fit px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-5">
                  Our Mission
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-pj-slate-900 mb-4 text-balance">
                  Simplify access to work — for everyone
                </h2>
                <p className="text-pj-slate-600 leading-relaxed mb-6">
                  We exist to simplify access to work opportunities while improving
                  trust, visibility, efficiency, and accessibility within the African
                  labor marketplace.
                </p>
                <ul className="mt-auto space-y-3">
                  {[
                    "Cleaning for your home",
                    "A developer for your website",
                    "Roadside assistance for your vehicle",
                  ].map((need) => (
                    <li key={need} className="flex items-center gap-3 text-pj-slate-700">
                      <span className="w-6 h-6 rounded-full bg-pj-blue-100 text-pj-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </span>
                      <span className="text-[15px] font-medium">{need}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Vision panel (dark gradient) */}
            <div className="animate-on-scroll stagger-1 relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-pj-blue-600 via-pj-blue-700 to-pj-blue-900 shadow-2xl shadow-pj-blue-900/20 flex flex-col justify-center p-8 sm:p-12 lg:p-14">
              {/* Decorative shapes */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
              </div>
              <div className="relative">
                <span className="inline-block w-fit px-4 py-1.5 rounded-full bg-white/15 text-white text-sm font-semibold mb-5">
                  Our Vision
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6 text-balance">
                  The most trusted workforce marketplace in Africa
                </h2>
                <p className="text-lg text-blue-100 leading-relaxed mb-8 max-w-lg">
                  We&apos;re bridging the gap between service demand and workforce
                  availability through cutting-edge technology, verified worker
                  profiles, location-aware discovery, and transparent review systems.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["Verified profiles", "Location-aware", "Transparent reviews"].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium"
                    >
                      <svg className="w-4 h-4 text-pj-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHO WE SERVE — 3 audience cards
          ══════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="animate-on-scroll inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-4">
              Who We Serve
            </span>
            <h2 className="animate-on-scroll stagger-1 text-3xl sm:text-4xl lg:text-5xl font-bold text-pj-slate-900 mb-4 text-balance">
              One platform, every side of work
            </h2>
            <p className="animate-on-scroll stagger-2 text-lg text-pj-slate-500">
              Whether you&apos;re hiring help or offering it, PocketJobs brings the
              right people together.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {audiences.map((aud, i) => (
              <div
                key={aud.title}
                className={`animate-on-scroll stagger-${i + 1} group bg-white rounded-3xl overflow-hidden border border-pj-slate-100 hover:shadow-xl hover:shadow-pj-blue-900/5 hover:-translate-y-1 transition-all duration-300`}
              >
                <div className="relative aspect-[3/2] overflow-hidden">
                  <img
                    src={`${CDN}/${aud.image}`}
                    alt={aud.alt}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pj-slate-900/40 to-transparent" />
                </div>
                <div className="p-6 lg:p-7">
                  <h3 className="text-xl font-bold text-pj-slate-900 mb-2 group-hover:text-pj-blue-600 transition-colors">
                    {aud.title}
                  </h3>
                  <p className="text-pj-slate-500 leading-relaxed">{aud.line}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PULL QUOTE — rhythm breaker
          ══════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 bg-pj-slate-50 border-y border-pj-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <svg
            className="animate-on-scroll w-12 h-12 mx-auto text-pj-blue-200 mb-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.978zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <blockquote className="animate-on-scroll stagger-1 text-2xl sm:text-3xl lg:text-4xl font-bold text-pj-slate-900 leading-snug text-balance">
            We&apos;re putting more work into the hands of skilled people across{" "}
            <span className="gradient-text">Zimbabwe and the wider continent</span>{" "}
            — and giving clients a trusted, transparent way to find them.
          </blockquote>
          <div className="animate-on-scroll stagger-2 mt-8 text-pj-slate-500 font-medium">
            Work made simple. Opportunities made possible.
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHAT WE STAND FOR — value / trust cards
          ══════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="animate-on-scroll inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-4">
              What We Stand For
            </span>
            <h2 className="animate-on-scroll stagger-1 text-3xl sm:text-4xl lg:text-5xl font-bold text-pj-slate-900 mb-4 text-balance">
              Built on trust, end to end
            </h2>
            <p className="animate-on-scroll stagger-2 text-lg text-pj-slate-500">
              Every part of PocketJobs is designed to make hiring and working feel
              safe, clear, and simple.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((val, i) => (
              <div
                key={val.title}
                className={`animate-on-scroll stagger-${i + 1} group bg-white rounded-3xl overflow-hidden border border-pj-slate-100 hover:shadow-xl hover:shadow-pj-blue-900/5 transition-all duration-300`}
              >
                <div className="relative aspect-[3/2] overflow-hidden">
                  <img
                    src={`${CDN}/${val.image}`}
                    alt={val.alt}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pj-slate-900/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 w-11 h-11 rounded-2xl glass-solid text-pj-blue-600 flex items-center justify-center shadow-lg shadow-pj-blue-900/10">
                    {val.icon}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-pj-slate-900 mb-2">
                    {val.title}
                  </h3>
                  <p className="text-sm text-pj-slate-500 leading-relaxed">
                    {val.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAND
          ══════════════════════════════════════════ */}
      <section className="py-16 lg:py-20 bg-pj-slate-50 border-y border-pj-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`animate-on-scroll stagger-${i + 1} bg-white rounded-2xl p-7 border border-pj-slate-100 text-center hover:shadow-xl hover:shadow-pj-blue-900/5 transition-all duration-300`}
              >
                <div className="text-3xl lg:text-4xl font-extrabold text-pj-blue-600 mb-2 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm text-pj-slate-500 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
          <p className="animate-on-scroll mt-10 text-center text-pj-slate-500 max-w-2xl mx-auto">
            Built in Zimbabwe for Africa, with verified providers and
            cash-on-completion payments at the heart of every job.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA
          ══════════════════════════════════════════ */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-on-scroll relative bg-gradient-to-br from-pj-blue-600 via-pj-blue-700 to-pj-blue-900 rounded-3xl px-8 py-16 lg:px-16 lg:py-20 text-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
            </div>
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance">
                Bring the right experts straight to your pocket
              </h2>
              <p className="text-lg text-blue-200 max-w-xl mx-auto mb-10">
                Join the workforce marketplace built in Zimbabwe for Africa —
                whether you&apos;re hiring help or offering your skills.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="secondary"
                  size="lg"
                  href="/signup"
                  className="bg-white text-pj-blue-700 hover:bg-blue-50 hover:text-pj-blue-800 shadow-lg"
                  id="about-cta-signup"
                >
                  Get started free
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  href="/browse"
                  className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
                  id="about-cta-browse"
                >
                  Browse providers
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* eslint-enable @next/next/no-img-element */}

      <Footer />
    </div>
  );
}
