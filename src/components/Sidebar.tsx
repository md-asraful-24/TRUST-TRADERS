/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  FolderOpen,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  FlaskConical,
  Sun,
  Moon,
  Shield,
  Info,
  Home,
  Users,
  Lock,
  Eye,
  EyeOff,
  Settings
} from "lucide-react";
import { useAdminStatus } from "@/lib/authUtils";
import { mockDb } from "@/lib/supabase";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<{ logoUrl?: string }>({});
  const [themeSettings, setThemeSettings] = useState<any>({});

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    const sessionUser = localStorage.getItem("cf_auth_user");
    if (sessionUser) {
      setUserEmail(sessionUser);
    }
    
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data.companyInfo) setCompanyInfo(data.companyInfo);
      else setCompanyInfo(mockDb.getCompanyInfo());
      
      if (data.theme) setThemeSettings(data.theme);
      else setThemeSettings(mockDb.getThemeSettings());
    }).catch(() => {
      setCompanyInfo(mockDb.getCompanyInfo());
    });
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("cf_auth_user");
    document.cookie = "cf_auth_token=; path=/; max-age=0;";
    router.push("/login");
  };

  const { isAdmin, isSuperAdmin } = useAdminStatus();

  // Hide sidebar on print or login
  if (pathname === "/login" || pathname?.startsWith("/print")) {
    return null;
  }

  const navItems: NavItem[] = [
    { name: "Home", href: "/", icon: Home },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "About", href: "/about", icon: Info }
  ];

  if (isAdmin) {
    navItems.splice(1, 0, 
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { name: "Document Vault", href: "/documents", icon: FolderOpen },
      { name: "হিসাবের খাতা", href: "/transactions", icon: FileText }
    );
    if (isSuperAdmin) {
      navItems.push({ name: "Super Admin", href: "/admin", icon: Shield });
    }
  }

  return (
    <>
      {/* Mobile Top Bar (Only visible on small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-50/90 dark:bg-slate-950/90 border-b border-slate-200/50 dark:border-slate-800/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between no-print shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-xl bg-slate-200/50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 overflow-hidden">
            {companyInfo.logoUrl ? (
              <img src={companyInfo.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-cover shadow-sm shrink-0" />
            ) : (
              <div className="p-1.5 rounded-lg text-white bg-teal-600 shrink-0">
                <FlaskConical className="w-5 h-5" />
              </div>
            )}
            <span className={`font-bold text-transparent bg-clip-text bg-gradient-to-r ${themeSettings?.heroTitleGradient || 'from-teal-400 to-emerald-300'} truncate max-w-[120px]`}>Trust Traders</span>
          </div>
        </div>

        {pathname !== '/' && (
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-slate-200/50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 shrink-0 flex items-center justify-center transition-colors hover:bg-slate-300/50 dark:hover:bg-slate-700/80"
            aria-label="Go Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Drawer Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* The Sidebar (Fixed on Desktop, Slide-out on Mobile) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-44 md:w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/50 flex flex-col justify-between transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none no-print ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex flex-col h-full overflow-y-auto hide-scrollbar">
          
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between px-3 md:px-5 py-4 md:py-6">
            <div className="flex items-center gap-2 md:gap-3 overflow-hidden pr-2">
              {companyInfo.logoUrl ? (
                <img src={companyInfo.logoUrl} alt="Logo" className="w-8 h-8 md:w-10 md:h-10 rounded-xl object-cover shadow-md shadow-teal-500/20 shrink-0" />
              ) : (
                <div className="p-1.5 md:p-2 rounded-xl text-white shadow-md shadow-teal-500/20 bg-teal-600 shrink-0">
                  <FlaskConical className="w-4 h-4 md:w-6 md:h-6" />
                </div>
              )}
              <div className="overflow-hidden">
                <h1 className={`font-bold md:font-extrabold tracking-tight text-xs md:text-lg text-transparent bg-clip-text bg-gradient-to-r ${themeSettings?.heroTitleGradient || 'from-teal-400 to-emerald-300'} truncate`}>Trust Traders</h1>
                <p className="text-[8px] md:text-[10px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider truncate">Chemical Factory</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1.5 md:p-2 rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 shrink-0"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* User Profile Summary */}
          {userEmail && (
            <div className="px-3 md:px-4 mb-4 md:mb-6">
              <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/50 p-2 md:p-3 rounded-2xl flex items-center gap-2 md:gap-3">
                <div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-teal-600/10 text-teal-600 flex items-center justify-center font-bold text-xs md:text-base shrink-0">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase">Active User</p>
                  <p className="text-[10px] md:text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{userEmail}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="px-2 md:px-4 py-2 space-y-1 md:space-y-1.5 flex-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3.5 rounded-2xl text-[12px] md:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100"
                  }`}
                >
                  <div className={`p-1.5 md:p-2 rounded-xl border border-white/10 shadow-sm shrink-0 flex items-center justify-center ${themeSettings?.heroLogoBackground || 'bg-slate-900/40 backdrop-blur-md'}`}>
                    <item.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? "text-white" : "text-white/90"}`} />
                  </div>
                  <span className={`${isActive ? "font-bold" : "font-semibold"} whitespace-nowrap overflow-hidden text-ellipsis`}>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* Footer Actions */}
          <div className="p-3 md:p-4 mt-auto border-t border-slate-200/50 dark:border-slate-800/50 space-y-1.5 md:space-y-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 md:gap-3 w-full px-3 md:px-4 py-2.5 md:py-3 rounded-2xl text-[12px] md:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 md:w-5 md:h-5 text-teal-400 shrink-0" /> : <Moon className="w-3.5 h-3.5 md:w-5 md:h-5 shrink-0" />}
              <span className="whitespace-nowrap overflow-hidden text-ellipsis">{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 md:gap-3 w-full px-3 md:px-4 py-2.5 md:py-3 rounded-2xl text-[12px] md:text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 md:w-5 md:h-5 shrink-0" />
              <span className="whitespace-nowrap overflow-hidden text-ellipsis">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

