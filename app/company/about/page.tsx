"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 bg-pj-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-pj-blue-900/5 border border-pj-slate-100">
            <span className="inline-block px-4 py-1.5 rounded-full bg-pj-blue-50 text-pj-blue-600 text-sm font-semibold mb-6">
              Our Company
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-pj-slate-900 mb-6 tracking-tight">
              About PocketJobs
            </h1>
            <p className="text-lg text-pj-slate-600 leading-relaxed mb-6">
              PocketJobs is an innovative hybrid digital marketplace and gig economy platform designed to connect individuals, households, businesses, event organizers, and corporate clients with verified service providers, skilled workers, informal laborers, freelancers, and tradespeople in Zimbabwe and across Africa.
            </p>
            <p className="text-lg text-pj-slate-600 leading-relaxed mb-6">
              Our platform aims to simplify access to work opportunities while improving trust, visibility, efficiency, and accessibility within the African labor marketplace. Whether you need a cleaning service for your home, a developer for your website, or roadside assistance for your vehicle, PocketJobs brings the right experts straight to your pocket.
            </p>
            <h2 className="text-2xl font-bold text-pj-slate-900 mt-10 mb-4">Our Vision</h2>
            <p className="text-pj-slate-600 leading-relaxed mb-6">
              To become the leading and most trusted workforce marketplace in Africa, bridging the gap between service demand and workforce availability through cutting-edge technology, verified worker profiles, location-aware discovery, and transparent review systems.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 border-t border-pj-slate-100 pt-8">
              <div>
                <div className="text-3xl font-extrabold text-pj-blue-600 mb-2">Zimbabwe</div>
                <div className="text-sm text-pj-slate-500 font-medium">Headquarters</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-pj-blue-600 mb-2">5+ Months</div>
                <div className="text-sm text-pj-slate-500 font-medium">In Development</div>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-pj-blue-600 mb-2">9 Service Sectors</div>
                <div className="text-sm text-pj-slate-500 font-medium">Supported Categories</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
