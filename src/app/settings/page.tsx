"use client";

import React, { useState, useEffect } from "react";
import { Settings, Lock, Eye, EyeOff, Shield, ArrowRight, ShoppingCart, FileText, Users } from "lucide-react";
import { useAdminStatus } from "@/lib/authUtils";
import Link from "next/link";
import SuperAdminPage from "@/app/admin/page";
import OrdersListPage from "@/app/orders/page";
import ChalansListPage from "@/app/chalans/page";
import UsersPage from "@/app/admin/users/page";

export default function SettingsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'password' | 'orders' | 'chalans' | 'users' | 'site'>('password');

  const { isAdmin, isSuperAdmin } = useAdminStatus();

  useEffect(() => {
    const sessionUser = localStorage.getItem("cf_auth_user");
    if (sessionUser) {
      setUserEmail(sessionUser);
    }
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) return;
    setPassLoading(true);
    setPassError("");
    setPassSuccess("");

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, oldPassword, newPassword })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to change password');

      setPassSuccess("Password updated successfully.");
      setOldPassword("");
      setNewPassword("");
      setTimeout(() => {
        setPassSuccess("");
      }, 3000);
    } catch (err: any) {
      setPassError(err.message);
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50 flex items-center gap-3">
            <Settings className="w-8 h-8 text-teal-500" />
            Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your account settings and security.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-fit border border-slate-200/60 dark:border-slate-700/50">
        <button 
          onClick={() => setActiveTab('password')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'password' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-teal-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/30'}`}
        >
          <Lock className="w-4 h-4" />
          Change Password
        </button>
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/30'}`}
          >
            <ShoppingCart className="w-4 h-4" />
            Orders
          </button>
        )}
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('chalans')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'chalans' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/30'}`}
          >
            <FileText className="w-4 h-4" />
            Delivery Chalan
          </button>
        )}
        {isAdmin && (
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-rose-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/30'}`}
          >
            <Users className="w-4 h-4" />
            User Management
          </button>
        )}
        {isSuperAdmin && (
          <button 
            onClick={() => setActiveTab('site')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'site' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/30'}`}
          >
            <Shield className="w-4 h-4" />
            Super Admin
          </button>
        )}
      </div>

      <div className="w-full">
        {activeTab === 'password' && (
          <div className="max-w-2xl bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-teal-500" />
                Change Password
              </h2>

          {passError && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-semibold">
              {passError}
            </div>
          )}
          {passSuccess && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-semibold">
              {passSuccess}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-slate-800 dark:text-white"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-teal-500 transition-colors focus:outline-none"
                >
                  {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-slate-800 dark:text-white"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-teal-500 transition-colors focus:outline-none"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 text-white rounded-xl font-bold transition-all disabled:opacity-50 mt-2 shadow-md"
            >
              {passLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
      )}

      {isAdmin && activeTab === 'orders' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <OrdersListPage />
        </div>
      )}

      {isAdmin && activeTab === 'chalans' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ChalansListPage />
        </div>
      )}

      {isAdmin && activeTab === 'users' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <UsersPage />
        </div>
      )}

      {isSuperAdmin && activeTab === 'site' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <SuperAdminPage />
        </div>
      )}

      </div>
    </div>
  );
}
