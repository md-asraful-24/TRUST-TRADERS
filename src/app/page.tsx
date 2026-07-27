"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Filter, ChevronRight, ShieldCheck, Truck, Activity, FlaskConical } from "lucide-react";
import { mockDb } from "@/lib/supabase";

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("All Categories");
  const [heroBannerUrl, setHeroBannerUrl] = useState("");
  const [companyInfo, setCompanyInfo] = useState<any>({});
  const [themeSettings, setThemeSettings] = useState<any>({});

  useEffect(() => {
    fetch('/api/settings', { next: { revalidate: 60 } } as any).then(res => res.json()).then(data => {
      if (data.companyInfo) {
        setCompanyInfo(data.companyInfo);
        if (data.companyInfo.heroBannerUrl) {
          setHeroBannerUrl(data.companyInfo.heroBannerUrl);
        }
      } else {
        const info = mockDb.getCompanyInfo();
        setCompanyInfo(info);
        if (info.heroBannerUrl) setHeroBannerUrl(info.heroBannerUrl);
      }
      
      if (data.theme) setThemeSettings(data.theme);
      else setThemeSettings(mockDb.getThemeSettings());
    }).catch(() => {
      const info = mockDb.getCompanyInfo();
      if (info) {
        setCompanyInfo(info);
        if (info.heroBannerUrl) {
          setHeroBannerUrl(info.heroBannerUrl);
        }
      }
      const t = mockDb.getThemeSettings();
      if (t) setThemeSettings(t);
    });
  }, []);

  const categories = [
    "All Categories",
    "Dyeing",
    "Processing",
    "Pre-treatment",
    "Finishing",
    "Washing",
    "Enzymes",
    "Softener"
  ];

  return (
    <div className="w-full min-h-screen text-slate-900 dark:text-slate-100 pb-24">
      
      {/* 1. Massive Hero Banner */}
      <div 
        className={`relative w-full h-[280px] md:h-[500px] rounded-[2rem] overflow-hidden mb-8 md:mb-12 shadow-2xl group border border-slate-800/60 ${!heroBannerUrl ? (themeSettings?.heroLogoBackground || 'bg-slate-900') : ''}`}
        style={heroBannerUrl ? { backgroundImage: `url(${heroBannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {/* Top-Left Logo inside Hero Banner */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 z-30 flex items-center gap-3">
          {companyInfo?.logoUrl ? (
            <img src={companyInfo.logoUrl} alt="Logo" className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover shadow-lg border border-white/10" />
          ) : (
            <div className="p-2.5 rounded-xl text-white border border-white/10 shadow-lg bg-teal-600">
              <FlaskConical className="w-6 h-6 md:w-7 md:h-7" />
            </div>
          )}
          <div className="px-3 py-1.5 rounded-xl border border-white/10 shadow-lg bg-slate-900/40 backdrop-blur-md">
            <h1 className={`font-extrabold tracking-tight md:text-lg leading-tight text-transparent bg-clip-text bg-gradient-to-r ${themeSettings?.heroTitleGradient || 'from-teal-400 to-emerald-300'}`}>Trust Traders</h1>
          </div>
        </div>

        {!heroBannerUrl && (
          <>
            {/* Placeholder image background - user can upload their own via Admin or we just use a cool dark gradient */}
            {!themeSettings?.heroLogoBackground && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 z-0" />
            )}
            
            {/* Decorative elements for the banner */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-white/5 blur-[120px] rounded-full pointer-events-none z-0" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0 mix-blend-overlay" />

            <div className="relative z-20 w-full h-full flex flex-col items-center justify-center text-center p-6">
              <h1 className={`text-4xl md:text-6xl font-black tracking-tighter drop-shadow-2xl text-transparent bg-clip-text bg-gradient-to-r ${themeSettings?.heroTitleGradient || 'from-teal-400 to-emerald-300'}`}>
                This is Trust Traders
              </h1>
              <p className={`mt-4 font-medium tracking-wide max-w-md mx-auto drop-shadow-md text-transparent bg-clip-text bg-gradient-to-r ${themeSettings?.heroTitleGradient || 'from-teal-400 to-emerald-300'}`}>
                {companyInfo?.heroSubtitle?.trim() ? companyInfo.heroSubtitle : 'PREMIUM CHEMICAL MANUFACTURING & SUPPLY'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* 2. Section Heading (Featured Collection) */}
      <div className="px-2 mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-[10px] font-bold uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Featured Collection
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">All Chemicals</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">Browse our premium chemical product collection</p>
      </div>

      {/* 3. Horizontal Scrollable Category Pills */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-10 hide-scrollbar px-2">
        <div className="flex-shrink-0 p-2 text-slate-500">
          <Filter className="w-5 h-5" />
        </div>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 border ${
              activeCategory === cat 
                ? 'bg-teal-600 text-white border-teal-500 shadow-lg shadow-teal-600/20' 
                : 'bg-white dark:bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/50 hover:border-slate-400 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-200 shadow-sm'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 4. Products / Content Section with Vertical Accent Line */}
      <div className="space-y-12 px-2">
        
        {/* Section Block */}
        <div className="w-full">
          {/* Section Accent Header */}
          <div className="flex items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="w-1.5 h-8 bg-teal-500 rounded-full shadow-[0_0_10px_rgba(20,184,166,0.6)]" />
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{activeCategory === "All Categories" ? "Top Chemicals" : activeCategory}</h3>
            <div className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700">
              24
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {/* Card 1 */}
            <Link href="/chalans" className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-3xl hover:border-teal-500/50 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-teal-500/10 block relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-teal-50 dark:group-hover:bg-teal-500/20 transition-colors">
                <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Certified Purity</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">Strict quality control for maximum performance in your factory.</p>
              <div className="flex items-center text-teal-600 dark:text-teal-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                View Details <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            {/* Card 2 */}
            <Link href="/chalans" className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-3xl hover:border-teal-500/50 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-teal-500/10 block relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-teal-50 dark:group-hover:bg-teal-500/20 transition-colors">
                <Truck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Fast Delivery</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">Robust logistics network with digital delivery chalans.</p>
              <div className="flex items-center text-teal-600 dark:text-teal-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                View Details <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>

            {/* Card 3 */}
            <Link href="/orders" className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 rounded-3xl hover:border-teal-500/50 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-teal-500/10 block relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-teal-50 dark:group-hover:bg-teal-500/20 transition-colors">
                <Activity className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Smart Management</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">Track orders and manage documents instantly via the portal.</p>
              <div className="flex items-center text-teal-600 dark:text-teal-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                View Details <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          </div>
        </div>

      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
