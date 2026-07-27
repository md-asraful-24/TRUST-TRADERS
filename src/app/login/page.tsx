"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FlaskConical, Lock, Mail, AlertTriangle, ArrowRight, 
  CheckCircle2, KeyRound, Eye, EyeOff
} from "lucide-react";
import Cookies from "js-cookie";

type Mode = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<1 | 2>(1);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  const [hashData, setHashData] = useState<{ hash: string; expiresAt: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [infoMsg, setInfoMsg] = useState("");
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("cf_auth_user");
    if (savedEmail) {
      setEmail(savedEmail);
    }
    
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setLogoUrl(data.theme?.logoUrl || data.companyInfo?.logoUrl || null);
      })
      .catch(console.error);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid credentials');

      Cookies.set("cf_auth_token", "verified_" + Date.now(), { expires: 7 });
      Cookies.set("cf_auth_role", data.role, { expires: 7 });
      Cookies.set("cf_auth_status", data.status, { expires: 7 });
      localStorage.setItem("cf_auth_user", email);

      if (data.status === 'Hold') {
        router.push("/pending-approval");
      } else if (data.role === 'User') {
        router.push("/");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to login.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Direct registration call (No OTP needed for registration)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      Cookies.set("cf_auth_token", "verified_" + Date.now(), { expires: 7 });
      Cookies.set("cf_auth_role", data.role, { expires: 7 });
      Cookies.set("cf_auth_status", data.status, { expires: 7 });
      localStorage.setItem("cf_auth_user", email);
      
      if (data.status === 'Hold') {
        router.push("/pending-approval");
      } else if (data.role === 'User') {
        router.push("/");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');

      setInfoMsg(`Code sent to ${email}. Check your Gmail inbox!`);

      setHashData({ hash: data.hash, expiresAt: data.expiresAt });
      setStep(2);
      setTimer(30);
    } catch (err: any) {
      setError(err.message || "An error occurred while sending code.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter a 6-digit OTP code.");
      return;
    }
    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (!hashData) throw new Error("Session expired. Please resend code.");

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          otp,
          hash: hashData.hash,
          expiresAt: hashData.expiresAt
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed');

      setMode('login');
      setStep(1);
      setPassword('');
      setOtp('');
      setError("");
      alert("Password changed successfully. Please login with your new password.");
    } catch (err: any) {
      setError(err.message || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setStep(1);
    setError("");
    setPassword("");
    setOtp("");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          {logoUrl ? (
            <div className="inline-flex items-center justify-center mb-6">
              <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-2xl object-cover shadow-xl ring-4 ring-slate-800/50 bg-slate-800" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700/50 shadow-xl mb-6 ring-4 ring-slate-800/50">
              <FlaskConical className="w-8 h-8 text-teal-400" />
            </div>
          )}
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400 mb-2">
            Trust Traders
          </h1>
          <p className="text-teal-500/80 font-bold tracking-widest text-sm uppercase">Chemical Factory Portal</p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
          <div className="mb-8 flex flex-col items-center">
            <div className="flex bg-slate-900/50 p-1 rounded-xl w-full">
              <button 
                type="button"
                onClick={() => switchMode('login')} 
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-teal-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Login
              </button>
              <button 
                type="button"
                onClick={() => switchMode('register')} 
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Register
              </button>
            </div>
            {mode === 'forgot' && (
              <h2 className="text-xl font-bold text-white mt-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-teal-400" />
                Reset Password
              </h2>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-200">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleStartRegister : handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                     {mode === 'login' && (
                        <button type="button" onClick={() => switchMode('forgot')} className="text-xs text-teal-400 hover:text-teal-300 font-semibold">
                          Forgot Password?
                        </button>
                     )}
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete={mode === 'login' ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="block w-full pl-11 pr-12 py-3 bg-slate-900/50 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-teal-400 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 mt-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'login' 
                      ? 'Sign In' 
                      : mode === 'register' 
                        ? 'Create Account' 
                        : 'Send Reset Code'}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              
              {mode === 'forgot' && (
                 <div className="text-center mt-4">
                   <button type="button" onClick={() => switchMode('login')} className="text-sm text-slate-400 hover:text-white">
                     Back to Login
                   </button>
                 </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerifyForgot} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-teal-500/10 border border-teal-500/20 p-4 rounded-xl flex items-start gap-3 mb-6">
                <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <p className="text-sm text-teal-100/90 leading-snug">{infoMsg || `Code sent to ${email}`}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Verification Code</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none font-mono tracking-widest text-lg"
                    placeholder="000000"
                  />
                </div>
              </div>

              {mode === 'forgot' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">New Password</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="block w-full pl-11 pr-12 py-3 bg-slate-900/50 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-teal-400 transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={timer > 0 || loading}
                  className="w-full py-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {timer > 0 ? `Resend code in ${timer}s` : "Didn't receive a code? Resend"}
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(""); setError(""); }}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    Go back
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>

        <p className="text-center text-[10px] text-slate-500 mt-8">
          © {new Date().getFullYear()} Trust Traders. Security Protocol 2.5.0-active.
        </p>
      </div>
    </div>
  );
}
