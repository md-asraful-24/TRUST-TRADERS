"use client";

import React, { useEffect, useState } from "react";
import { Globe, Phone, Mail, MapPin, FlaskConical, ArrowRight } from "lucide-react";
import { mockDb } from "@/lib/supabase";
import Link from "next/link";

export default function Footer() {
  const [info, setInfo] = useState({ facebook: '', mobile: '', mobile2: '', email: '', location: '', footerText: '', logoUrl: '' });
  const [themeSettings, setThemeSettings] = useState<any>({});

  useEffect(() => {
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data.companyInfo) setInfo(data.companyInfo);
      else setInfo(mockDb.getCompanyInfo());
      
      if (data.theme) setThemeSettings(data.theme);
      else setThemeSettings(mockDb.getThemeSettings());
    }).catch(() => {
      setInfo(mockDb.getCompanyInfo());
    });
  }, []);

  return (
    <footer className="w-full mt-auto relative overflow-hidden bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Decorative gradient blur in background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-teal-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="md:col-span-5 lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              {info.logoUrl ? (
                <img src={info.logoUrl} alt="Logo" className="w-11 h-11 rounded-xl object-cover shadow-lg shadow-teal-500/20" />
              ) : (
                <div className="p-2.5 bg-teal-500 rounded-xl text-slate-900 shadow-lg shadow-teal-500/30">
                  <FlaskConical className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className={`text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${themeSettings?.heroTitleGradient || 'from-teal-400 to-emerald-300'}`}>Trust Traders</h3>
                <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Chemical Factory</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Your trusted partner for high-quality dyeing chemicals. We ensure certified purity and seamless logistics for your supply chain.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 lg:col-span-3 space-y-6">
            <h4 className="text-white font-bold tracking-wide uppercase text-sm">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/home" className="text-slate-400 hover:text-teal-400 transition-colors text-sm flex items-center gap-2 group">
                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /> 
                  Home Page
                </Link>
              </li>
              <li>
                <Link href="/" className="text-slate-400 hover:text-teal-400 transition-colors text-sm flex items-center gap-2 group">
                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /> 
                  Client Dashboard
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-teal-400 transition-colors text-sm flex items-center gap-2 group">
                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" /> 
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="md:col-span-4 lg:col-span-5 space-y-6">
            <h4 className="text-white font-bold tracking-wide uppercase text-sm">Contact Us</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {info.mobile && (
                <a href={`tel:${info.mobile.replace(/[^\d+]/g, '')}`} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-all group">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Call Now (Primary)</p>
                    <p className="text-sm font-semibold text-slate-300 group-hover:text-emerald-400 transition-colors">{info.mobile}</p>
                  </div>
                </a>
              )}

              {info.mobile2 && (
                <a href={`tel:${info.mobile2.replace(/[^\d+]/g, '')}`} className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-all group">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 group-hover:bg-teal-500 group-hover:text-slate-900 transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Call Now (Secondary)</p>
                    <p className="text-sm font-semibold text-slate-300 group-hover:text-teal-400 transition-colors">{info.mobile2}</p>
                  </div>
                </a>
              )}

              {info.email && (
                <a 
                  href={info.email.toLowerCase().includes('gmail.com') ? `https://mail.google.com/mail/?view=cm&fs=1&to=${info.email}` : `mailto:${info.email}`} 
                  target={info.email.toLowerCase().includes('gmail.com') ? "_blank" : "_self"}
                  rel="noreferrer"
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-all group"
                >
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500 group-hover:text-slate-900 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Email Us</p>
                    <p className="text-sm font-semibold text-slate-300 group-hover:text-rose-400 transition-colors truncate">{info.email}</p>
                  </div>
                </a>
              )}

              {info.facebook && (
                <a href={info.facebook.startsWith('http') ? info.facebook : `https://${info.facebook}`} target="_blank" rel="noreferrer" className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition-all group">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Social Media</p>
                    <p className="text-sm font-semibold text-slate-300 group-hover:text-blue-400 transition-colors">Facebook Page</p>
                  </div>
                </a>
              )}

              {info.location && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="p-2 rounded-lg bg-slate-700 text-slate-300">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Headquarters</p>
                    <p className="text-sm font-semibold text-slate-300 truncate">{info.location}</p>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 text-center md:text-left">
            {info.footerText || '© 2026 Trust Traders Chemical Factory. All rights reserved.'}
          </p>
          <div className="text-sm text-slate-600 font-medium">
            Designed for Excellence
          </div>
        </div>
      </div>
    </footer>
  );
}

