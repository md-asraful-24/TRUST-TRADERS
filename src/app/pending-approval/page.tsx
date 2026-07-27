"use client";

import React from 'react';
import { Clock, ShieldAlert, LogOut } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export default function PendingApprovalPage() {
  const router = useRouter();

  const handleLogout = () => {
    Cookies.remove('cf_auth_token');
    Cookies.remove('cf_auth_role');
    Cookies.remove('cf_auth_status');
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-xl text-center relative overflow-hidden">
        {/* Decor */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        
        <div className="mx-auto w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-100 mb-4">Account Pending Approval</h1>
        
        <p className="text-slate-400 mb-6 leading-relaxed">
          Your account has been successfully created but is currently on <span className="font-bold text-amber-500">Hold</span>. 
          An administrator must review and activate your account before you can access the portal.
        </p>

        <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 flex items-start gap-3 text-left mb-8">
          <ShieldAlert className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-400">
            If you believe this is a mistake or you need urgent access, please contact the factory manager directly.
          </p>
        </div>

        <button 
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out and return to login
        </button>
      </div>
    </div>
  );
}
