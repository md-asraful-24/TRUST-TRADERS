/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { FlaskConical, Home, LayoutDashboard, ShoppingCart, FileText, FolderOpen, Info } from "lucide-react";
import Sidebar from "./Sidebar";
import FloatingCalculator from "./FloatingCalculator";
import Footer from "./Footer";
import AutoRefresh from "./AutoRefresh";
import { mockDb } from "@/lib/supabase";
import { useAdminStatus } from "@/lib/authUtils";

export default function LayoutWrapper({ children, globalSettings }: { children: React.ReactNode, globalSettings?: any }) {
  const pathname = usePathname();
  const router = useRouter();

  const themeSettings = globalSettings?.theme || null;
  const companyInfo = globalSettings?.companyInfo || mockDb.getCompanyInfo();

  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isAdmin, loading: adminLoading } = useAdminStatus();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setIsClient(true);
    const user = localStorage.getItem("cf_auth_user");

    if (user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      document.cookie = "cf_auth_token=; path=/; max-age=0;";
      // Public visitors can only access / and /login
      if (pathname !== "/login" && pathname !== "/") {
        router.push("/login");
      }
    }
  }, [pathname, router]);

  // Restrict non-admin users to home and public pages only
  useEffect(() => {
    if (!isClient || adminLoading || !isAuthenticated) return;
    const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/about";
    if (!isAdmin && !isPublicPage) {
    }
  }, [pathname, router, isClient, adminLoading, isAuthenticated, isAdmin]);

  // Prevent hydration layout shift flashes by rendering a blank background instead of a slow spinner
  if (!isClient) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-0" />;
  }

  const isAuthOrPrint = pathname === "/login" || pathname?.startsWith("/print");
  const isPublicHome = !isAuthenticated && pathname === "/";

  // To avoid hydration mismatch errors on the background, we only render the background image when mounted
  const showBgImage = isClient && themeSettings?.backgroundImageUrl;

  if (isAuthOrPrint) {
    return (
      <main className="w-full min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 relative">
        {showBgImage && (
          <div
            className="fixed inset-0 z-0 opacity-100"
            style={{
              backgroundImage: `url(${themeSettings.backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed'
            }}
          />
        )}
        <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center backdrop-blur-sm bg-white/30 dark:bg-slate-900/40">
          {children}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-200 relative overflow-hidden">

      {/* Background Layer */}
      {showBgImage ? (
        <div
          className="fixed inset-0 z-0 opacity-100"
          style={{
            backgroundImage: `url(${themeSettings.backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        />
      ) : (
        <>
          {/* Lighter background glows - use will-change for GPU acceleration */}
          <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/20 dark:bg-teal-600/15 rounded-full blur-[80px] pointer-events-none z-0 will-change-transform" />
          <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-500/15 dark:bg-fuchsia-600/8 rounded-full blur-[100px] pointer-events-none z-0 will-change-transform" />
        </>
      )}

      {/* Sidebar - Only show for authenticated users */}
      {!isPublicHome && <Sidebar />}

      {/* Public Home Page Header (Shows logo when Sidebar is hidden) */}
      {isPublicHome && (
        <div className="fixed top-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between no-print pointer-events-none">
          <div className="flex items-center gap-3 pointer-events-auto">
            {themeSettings?.logoUrl || companyInfo?.logoUrl ? (
              <img src={themeSettings?.logoUrl || companyInfo?.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-md shrink-0" />
            ) : (
              <div className="p-2 rounded-xl text-white shadow-md shadow-teal-500/20 bg-teal-600">
                <FlaskConical className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className={`font-extrabold tracking-tight text-lg text-transparent bg-clip-text bg-gradient-to-r ${themeSettings?.heroTitleGradient || 'from-teal-400 to-emerald-300'}`}>Trust Traders</h1>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">Chemical Factory</p>
            </div>
          </div>
        </div>
      )}

      {/* Main container - removed heavy backdrop-blur-xl for performance */}
      <main className={`flex-1 w-full min-h-screen flex flex-col print:pl-0 relative z-10 bg-white/60 dark:bg-slate-950/60 ${!isPublicHome ? 'pt-20 md:pt-0 md:pl-64' : ''}`}>
        <div className="flex-1 p-4 md:p-8 w-full relative z-20">
          {children}
        </div>
        <Footer />
      </main>

      <div className="relative z-30">
        <AutoRefresh />
        <FloatingCalculator />

        {/* Floating Login Option for Public Visitors */}
        {isPublicHome && (
          <div className="fixed bottom-6 left-6 z-50">
            <Link
              href="/login"
              className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-full font-bold shadow-lg shadow-teal-500/30 flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 border border-teal-500/50"
            >
              Sign In to Factory
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
