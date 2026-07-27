"use client";

import React, { useEffect, useState } from "react";
import { Globe, Phone, Mail, Info, MapPin } from "lucide-react";
import { mockDb } from "@/lib/supabase";

export default function AboutPage() {
  const [info, setInfo] = useState({ facebook: '', mobile: '', mobile2: '', email: '', location: '', logoUrl: '' });
  const [themeSettings, setThemeSettings] = useState<any>({});

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data.companyInfo) setInfo(data.companyInfo);
      else setInfo(mockDb.getCompanyInfo());
      if (data.theme) setThemeSettings(data.theme);
      else setThemeSettings(mockDb.getThemeSettings());
    }).catch(() => {
      setInfo(mockDb.getCompanyInfo());
      setThemeSettings(mockDb.getThemeSettings());
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-teal-500/20 to-blue-500/20 dark:from-teal-500/30 dark:to-blue-500/30 rounded-2xl">
          <Info className="w-8 h-8 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">About Us</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Company contact details and information</p>
        </div>
      </div>

      <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/60 rounded-[2.5rem] border border-slate-200/80 dark:border-slate-700/50 p-8 md:p-10 shadow-2xl backdrop-blur-xl">
        {/* Subtle Background Glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/20 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row gap-10 items-start">
          
          {/* Logo Section */}
          <div className="relative flex-shrink-0 group mx-auto md:mx-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-700"></div>
            <div className="relative w-36 h-36 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-700 shadow-2xl transform group-hover:scale-105 transition-transform duration-500 overflow-hidden">
              {info.logoUrl ? (
                <img src={info.logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl font-black bg-gradient-to-br from-teal-500 to-blue-600 bg-clip-text text-transparent tracking-tighter">
                  TT
                </span>
              )}
            </div>
          </div>
          
          <div className="space-y-8 flex-1">
            <div className="text-center md:text-left">
              <h2 className={`text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent mb-3 bg-gradient-to-r ${themeSettings?.heroTitleGradient || 'from-teal-400 to-emerald-300'}`}>
                Trust Traders Chemical Factory
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg font-medium max-w-2xl">
                We are a leading supplier of high-quality dyeing chemicals. Committed to safety, reliability, and excellence in providing essential compounds for the dyeing industry.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6 border-t border-slate-200/60 dark:border-slate-700/50">
              
              {/* Facebook Card */}
              <a href={info.facebook ? (info.facebook.startsWith('http') ? info.facebook : `https://${info.facebook}`) : '#'} target={info.facebook ? "_blank" : "_self"} rel="noreferrer" className="block flex items-center gap-5 p-5 rounded-3xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 dark:to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="p-3.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10 shadow-inner">
                  <Globe className="w-6 h-6" />
                </div>
                <div className="overflow-hidden relative z-10">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Facebook</p>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block truncate">
                    {info.facebook || 'Not added'}
                  </span>
                </div>
              </a>

              {/* Primary Mobile Card */}
              <a href={info.mobile ? `tel:${info.mobile.replace(/[^\d+]/g, '')}` : '#'} className="block flex items-center gap-5 p-5 rounded-3xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 dark:to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10 shadow-inner">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="overflow-hidden relative z-10">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Primary Mobile</p>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors block truncate">
                      {info.mobile || 'Not added'}
                    </span>
                  </div>
                </div>
              </a>

              {/* Secondary Mobile Card */}
              {info.mobile2 && (
                <a href={info.mobile2 ? `tel:${info.mobile2.replace(/[^\d+]/g, '')}` : '#'} className="block flex items-center gap-5 p-5 rounded-3xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:shadow-teal-500/5 dark:hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/0 to-teal-500/5 dark:to-teal-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  <div className="p-3.5 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 relative z-10 shadow-inner">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="overflow-hidden relative z-10">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Secondary Mobile</p>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors block truncate">
                        {info.mobile2}
                      </span>
                    </div>
                  </div>
                </a>
              )}

              {/* Email Card */}
              <a 
                href={info.email ? (info.email.toLowerCase().includes('gmail.com') ? `https://mail.google.com/mail/?view=cm&fs=1&to=${info.email}` : `mailto:${info.email}`) : '#'}
                target={info.email && info.email.toLowerCase().includes('gmail.com') ? "_blank" : "_self"}
                rel="noreferrer"
                className="block flex items-center gap-5 p-5 rounded-3xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:shadow-rose-500/5 dark:hover:shadow-rose-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/0 to-rose-500/5 dark:to-rose-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 relative z-10 shadow-inner">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="overflow-hidden relative z-10">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Email</p>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors block truncate">
                    {info.email || 'Not added'}
                  </span>
                </div>
              </a>
              
              {/* Headquarters Card */}
              <div className="flex items-center gap-5 p-5 rounded-3xl bg-white/50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 dark:hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden md:col-span-2">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/5 dark:to-purple-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="p-3.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 relative z-10 shadow-inner">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="overflow-hidden relative z-10">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Headquarters</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                    {info.location || 'Not added'}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

