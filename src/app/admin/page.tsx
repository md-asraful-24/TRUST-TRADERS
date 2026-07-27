"use client";
import React, { useState, useEffect } from "react";
import { Shield, Users, Database, Plus, Trash2, Settings, Save, Palette, Type, X, FlaskConical } from "lucide-react";
import { useAdminStatus } from "@/lib/authUtils";
import { mockDb } from "@/lib/supabase";

export default function SuperAdminPage() {
  const { isSuperAdmin, loading } = useAdminStatus();
  const [extraAdmins, setExtraAdmins] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [companyInfo, setCompanyInfo] = useState({ facebook: '', mobile: '', mobile2: '', email: '', location: '', footerText: '', heroBannerUrl: '', logoUrl: '', heroSubtitle: '' });
  const [savingInfo, setSavingInfo] = useState(false);
  const [themeSettings, setThemeSettings] = useState<any>({ primary: '#0d9488', backgroundDark: '#0f172a', backgroundLight: '#f8fafc', backgroundImageUrl: '', heroTitleGradient: 'from-teal-400 to-emerald-300', heroLogoBackground: 'bg-slate-900/40 backdrop-blur-md' });
  const [savingTheme, setSavingTheme] = useState(false);
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyWebhooks, setCompanyWebhooks] = useState<Record<string, string>>({});
  const [savingWebhooks, setSavingWebhooks] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({});
  const [newCompany, setNewCompany] = useState("");
  const [chemicals, setChemicals] = useState<string[]>([]);
  const [newChemical, setNewChemical] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("cf_extra_admins");
    if (saved) {
      setExtraAdmins(JSON.parse(saved));
    }
    setCompanies(mockDb.getCompanies());
    
    fetch('/api/settings').then(res => res.json()).then(data => {
      if (data.companyInfo) setCompanyInfo(data.companyInfo);
      else setCompanyInfo(mockDb.getCompanyInfo());
      if (data.theme) setThemeSettings(data.theme);
      else setThemeSettings(mockDb.getThemeSettings());
      if (data.companies && data.companies.length > 0) setCompanies(data.companies);
      else setCompanies(mockDb.getCompanies());
      
      if (data.companyWebhooks) setCompanyWebhooks(data.companyWebhooks);
      if (data.companyInfo && data.companyInfo.chemicals) setChemicals(data.companyInfo.chemicals);
      else setChemicals(mockDb.getChemicals());
    }).catch(() => {
      setCompanyInfo(mockDb.getCompanyInfo());
      setThemeSettings(mockDb.getThemeSettings());
    });
  }, []);

  const handleSaveCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    mockDb.saveCompanyInfo(companyInfo);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyInfo })
      });
    } catch (err) {}
    setTimeout(() => {
      setSavingInfo(false);
      window.location.reload();
    }, 500);
  };

  const handleSaveThemeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTheme(true);
    mockDb.saveThemeSettings(themeSettings);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: themeSettings })
      });
    } catch (err) {}
    setTimeout(() => {
      setSavingTheme(false);
      window.location.reload();
    }, 500);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;
    const email = newAdminEmail.toLowerCase().trim();

    try {
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'Admin', status: 'Active' })
      });
    } catch (err) {
      console.error(err);
    }

    if (!extraAdmins.includes(email)) {
      const updated = [...extraAdmins, email];
      setExtraAdmins(updated);
      localStorage.setItem("cf_extra_admins", JSON.stringify(updated));
    }
    setNewAdminEmail("");
  };

  const handleRemoveAdmin = async (email: string) => {
    try {
      await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'User' })
      });
    } catch (err) {
      console.error(err);
    }

    const updated = extraAdmins.filter(e => e !== email);
    setExtraAdmins(updated);
    localStorage.setItem("cf_extra_admins", JSON.stringify(updated));
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim()) return;
    const name = newCompany.trim();
    if (!companies.includes(name)) {
      const updated = [...companies, name];
      setCompanies(updated);
      mockDb.saveCompanies(updated);
      try {
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companies: updated })
        });
      } catch (err) {}
    }
    setNewCompany("");
  };

  const handleRemoveCompany = async (name: string) => {
    const updated = companies.filter(c => c !== name);
    setCompanies(updated);
    mockDb.saveCompanies(updated);
    
    // Also remove webhook mapping if it exists
    const updatedWebhooks = { ...companyWebhooks };
    delete updatedWebhooks[name];
    setCompanyWebhooks(updatedWebhooks);

    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: updated, companyWebhooks: updatedWebhooks })
      });
    } catch (err) {}
  };

  const handleUpdateWebhook = async (company: string, url: string) => {
    setSavingWebhooks(prev => ({ ...prev, [company]: 'saving' }));
    const updated = { ...companyWebhooks, [company]: url };
    setCompanyWebhooks(updated);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyWebhooks: updated })
      });
      setSavingWebhooks(prev => ({ ...prev, [company]: 'saved' }));
      setTimeout(() => {
        setSavingWebhooks(prev => ({ ...prev, [company]: 'idle' }));
      }, 2000);
    } catch (err) {
      setSavingWebhooks(prev => ({ ...prev, [company]: 'idle' }));
    }
  };

  const handleAddChemical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChemical.trim()) return;
    const name = newChemical.trim();
    if (!chemicals.includes(name)) {
      const updated = [...chemicals, name];
      setChemicals(updated);
      mockDb.saveChemicals(updated);
      try {
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chemicals: updated })
        });
      } catch (err) {}
    }
    setNewChemical("");
  };

  const handleRemoveChemical = async (name: string) => {
    const updated = chemicals.filter(c => c !== name);
    setChemicals(updated);
    mockDb.saveChemicals(updated);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chemicals: updated })
      });
    } catch (err) {}
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 font-semibold">Checking admin credentials...</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Shield className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Access Denied</h1>
        <p className="text-slate-500 dark:text-slate-400">You do not have permission to view the Super Admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-teal-600" />
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50">Super Admin Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage system settings and control user access</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Add New Admin</h3>
              <p className="text-xs text-slate-500 mt-1">Grant super admin privileges to other users.</p>
            </div>
          </div>
          
          <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-2 mt-2">
            <input 
              type="email" 
              placeholder="Enter user's email address" 
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-4 text-sm outline-none transition-colors"
              required
            />
            <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Give Access
            </button>
          </form>

          {extraAdmins.length > 0 && (
            <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Authorized Admins</h4>
              <div className="space-y-2">
                {extraAdmins.map(email => (
                  <div key={email} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{email}</span>
                    <button onClick={() => handleRemoveAdmin(email)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100">System Logs</h3>
            <p className="text-xs text-slate-500 mt-1">View deletion logs and database activity (Coming Soon).</p>
          </div>
        </div>

        {/* Manage Companies */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 lg:col-span-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Manage Companies</h3>
              <p className="text-xs text-slate-500 mt-1">Add or remove company names used in the Document Vault.</p>
            </div>
          </div>
          
          <form onSubmit={handleAddCompany} className="flex flex-col sm:flex-row gap-2 mt-2">
            <input 
              type="text" 
              placeholder="Enter new company name..." 
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-orange-500 rounded-xl py-2.5 px-4 text-sm outline-none transition-colors"
              required
            />
            <button type="submit" className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Company
            </button>
          </form>

          {companies.length > 0 && (
            <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-3">
              {companies.map(name => (
                <div key={name} className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate pr-2">{name}</span>
                    <button onClick={() => handleRemoveCompany(name)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Google Sheets Webhook URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        placeholder="https://script.google.com/macros/s/..." 
                        value={companyWebhooks[name] || ''}
                        onChange={(e) => setCompanyWebhooks({...companyWebhooks, [name]: e.target.value})}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-orange-500 rounded-lg py-2 px-3 text-xs outline-none transition-colors"
                      />
                      <button 
                        type="button"
                        onClick={() => handleUpdateWebhook(name, companyWebhooks[name] || '')}
                        disabled={savingWebhooks[name] === 'saving'}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm shrink-0 ${
                          savingWebhooks[name] === 'saving' 
                            ? 'bg-amber-600 text-white cursor-wait' 
                            : savingWebhooks[name] === 'saved'
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-orange-600 hover:bg-orange-500 text-white cursor-pointer'
                        }`}
                      >
                        {savingWebhooks[name] === 'saving' ? 'Saving...' : savingWebhooks[name] === 'saved' ? 'Saved!' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manage Chemicals */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 lg:col-span-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Manage Chemicals</h3>
              <p className="text-xs text-slate-500 mt-1">Add or remove chemical names used in the transactions dropdown.</p>
            </div>
          </div>
          
          <form onSubmit={handleAddChemical} className="flex flex-col sm:flex-row gap-2 mt-2">
            <input 
              type="text" 
              placeholder="Enter new chemical name..." 
              value={newChemical}
              onChange={(e) => setNewChemical(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-fuchsia-500 rounded-xl py-2.5 px-4 text-sm outline-none transition-colors"
              required
            />
            <button type="submit" className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Chemical
            </button>
          </form>

          {chemicals.length > 0 && (
            <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {chemicals.map(name => (
                <div key={name} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{name}</span>
                  <button onClick={() => handleRemoveChemical(name)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Company Info Settings */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 lg:col-span-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">About Section Settings</h3>
              <p className="text-xs text-slate-500 mt-1">Manage public contact information displayed in the About page.</p>
            </div>
          </div>
          
          <form onSubmit={handleSaveCompanyInfo} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Facebook Link</label>
              <input 
                type="url" 
                value={companyInfo.facebook}
                onChange={(e) => setCompanyInfo({...companyInfo, facebook: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-xl py-2.5 px-4 text-sm outline-none transition-colors"
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Number</label>
              <input 
                type="text" 
                value={companyInfo.mobile}
                onChange={(e) => setCompanyInfo({...companyInfo, mobile: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-xl py-2.5 px-4 text-sm outline-none transition-colors"
                placeholder="+8801..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Secondary Mobile Number</label>
              <input 
                type="text" 
                value={companyInfo.mobile2 || ''}
                onChange={(e) => setCompanyInfo({...companyInfo, mobile2: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-xl py-2.5 px-4 text-sm outline-none transition-colors"
                placeholder="+8801... (Optional)"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                value={companyInfo.email}
                onChange={(e) => setCompanyInfo({...companyInfo, email: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-xl py-2.5 px-4 text-sm outline-none transition-colors"
                placeholder="contact@..."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</label>
              <input 
                type="text" 
                value={companyInfo.location}
                onChange={(e) => setCompanyInfo({...companyInfo, location: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-xl py-2.5 px-4 text-sm outline-none transition-colors"
                placeholder="City, Country"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Footer Text</label>
              <div className="relative">
                <Type className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={companyInfo.footerText || ''}
                  onChange={(e) => setCompanyInfo({...companyInfo, footerText: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-colors"
                  placeholder="© 2026 Trust Traders. All rights reserved."
                />
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Home Page Subtitle</label>
              <div className="relative">
                <Type className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={companyInfo.heroSubtitle || ''}
                  onChange={(e) => setCompanyInfo({...companyInfo, heroSubtitle: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-colors"
                  placeholder="PREMIUM CHEMICAL MANUFACTURING & SUPPLY"
                />
              </div>
            </div>
            
            <div className="space-y-1 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Company Logo Image</label>
              <p className="text-[10px] text-slate-400">Upload a logo to appear instead of the 'TT' text.</p>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                {companyInfo.logoUrl ? (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shrink-0">
                    <img src={companyInfo.logoUrl} alt="Logo Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-teal-500 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-8 h-8 text-white" />
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const newInfo = {...companyInfo, logoUrl: reader.result as string};
                          setCompanyInfo(newInfo);
                          mockDb.saveCompanyInfo(newInfo);
                          setSavingInfo(true);
                          try {
                            await fetch('/api/settings', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ companyInfo: newInfo })
                            });
                          } catch (err) {}
                          setTimeout(() => window.location.reload(), 500);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-900/30 dark:file:text-teal-400 cursor-pointer"
                  />
                  {companyInfo.logoUrl && (
                    <button 
                      type="button" 
                      onClick={async () => {
                        const newInfo = {...companyInfo, logoUrl: ''};
                        setCompanyInfo(newInfo);
                        mockDb.saveCompanyInfo(newInfo);
                        setSavingInfo(true);
                        try {
                          await fetch('/api/settings', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ companyInfo: newInfo })
                          });
                        } catch (err) {}
                        setTimeout(() => window.location.reload(), 500);
                      }}
                      className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-bold w-fit bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Current Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Home Page Hero Image (Optional)</label>
              <p className="text-[10px] text-slate-400">Paste an image URL to replace the "This is Trust Traders" text block.</p>
              <div className="relative mt-2">
                <Type className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="url" 
                  value={companyInfo.heroBannerUrl || ''}
                  onChange={(e) => setCompanyInfo({...companyInfo, heroBannerUrl: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-colors"
                  placeholder="https://example.com/banner-image.jpg"
                />
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2">
                <Save className="w-4 h-4" />
                {savingInfo ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 lg:col-span-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Website Colors & Theme</h3>
              <p className="text-xs text-slate-500 mt-1">Change the primary accent color and background colors.</p>
            </div>
          </div>
          
          <form onSubmit={handleSaveThemeSettings} className="grid grid-cols-1 gap-6 mt-4">
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Accent Color</label>
              <div className="flex flex-wrap items-center gap-3">
                {['#0d9488', '#2563eb', '#e11d48', '#7c3aed', '#ea580c', '#059669', '#d946ef', '#14b8a6', '#fbbf24', '#f59e0b', '#d97706', '#84cc16', '#65a30d', '#4d7c0f', '#10b981', '#047857', '#06b6d4', '#0891b2', '#0e7490', '#3b82f6', '#1d4ed8', '#6366f1', '#4338ca', '#a855f7', '#7e22ce', '#ec4899', '#be185d', '#f43f5e', '#be123c'].map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setThemeSettings({...themeSettings, primary: hex})}
                    className={`w-8 h-8 rounded-full shadow-sm border-2 transition-transform hover:scale-110 active:scale-95 ${themeSettings.primary === hex ? 'border-slate-800 dark:border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dark Mode Background</label>
                <div className="flex flex-wrap items-center gap-3">
                  {['#0f172a', '#18181b', '#000000', '#1e1b4b', '#111827', '#0f111a', '#0a0a0a', '#121212', '#141414', '#1c1c1c', '#020617', '#0B1120', '#172554', '#1e3a8a', '#2e1065', '#3b0764', '#4c1d95', '#4c0519', '#701a75', '#831843', '#022c22', '#064e3b', '#065f46', '#451a03', '#78350f', '#713f12'].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setThemeSettings({...themeSettings, backgroundDark: hex})}
                      className={`w-8 h-8 rounded-full shadow-sm border-2 transition-transform hover:scale-110 active:scale-95 ${themeSettings.backgroundDark === hex ? 'border-teal-500 scale-110' : 'border-slate-300 dark:border-slate-600'}`}
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Light Mode Background</label>
                <div className="flex flex-wrap items-center gap-3">
                  {['#f8fafc', '#fafafa', '#ffffff', '#fefce8', '#fff1f2', '#f3f4f6', '#fdfdfd', '#fcfcfc', '#f5f5f5', '#f4f4f5', '#eff6ff', '#f0fdfa', '#ecfeff', '#e0f2fe', '#f5f3ff', '#faf5ff', '#fdf4ff', '#fff7ed', '#ffedd5', '#fef3c7', '#f0fdf4', '#ecfdf5', '#dcfce7', '#fffbeb', '#fef08a'].map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setThemeSettings({...themeSettings, backgroundLight: hex})}
                      className={`w-8 h-8 rounded-full shadow-sm border-2 transition-transform hover:scale-110 active:scale-95 ${themeSettings.backgroundLight === hex ? 'border-teal-500 scale-110' : 'border-slate-300 dark:border-slate-600'}`}
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hero Title Gradient</label>
              <p className="text-[10px] text-slate-400 -mt-2">Choose a gorgeous mixed color for the "Trust Traders" title on the Home Page.</p>
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { id: 'teal-emerald', name: 'Nature Teal', classes: 'from-teal-400 to-emerald-300' },
                  { id: 'blue-cyan', name: 'Ocean Blue', classes: 'from-blue-400 to-cyan-300' },
                  { id: 'purple-pink', name: 'Sunset Purple', classes: 'from-purple-400 to-pink-300' },
                  { id: 'orange-rose', name: 'Fire Orange', classes: 'from-orange-400 to-rose-300' },
                  { id: 'amber-yellow', name: 'Royal Gold', classes: 'from-amber-400 to-yellow-300' },
                  { id: 'slate-silver', name: 'Silver Slate', classes: 'from-slate-400 to-slate-200' },
                  { id: 'indigo-violet', name: 'Indigo Violet', classes: 'from-indigo-400 to-violet-300' },
                  { id: 'cyberpunk', name: 'Cyberpunk', classes: 'from-yellow-400 via-pink-500 to-purple-600' },
                  { id: 'northern-lights', name: 'Northern Lights', classes: 'from-teal-300 via-emerald-400 to-cyan-500' },
                  { id: 'midnight-magic', name: 'Midnight Magic', classes: 'from-indigo-600 via-purple-600 to-fuchsia-500' },
                  { id: 'fiery-dawn', name: 'Fiery Dawn', classes: 'from-rose-500 via-red-400 to-orange-400' },
                  { id: 'rainbow-mix', name: 'Rainbow Mix', classes: 'from-red-500 via-yellow-400 to-emerald-500' },
                  { id: 'cotton-candy', name: 'Cotton Candy', classes: 'from-pink-300 via-purple-300 to-indigo-400' },
                  { id: 'ocean-depth', name: 'Ocean Depth', classes: 'from-cyan-400 via-blue-500 to-indigo-600' },
                  { id: 'galaxy', name: 'Galaxy Mix', classes: 'from-blue-600 via-purple-500 to-pink-500' },
                  { id: 'neon-sunset', name: 'Neon Sunset', classes: 'from-fuchsia-500 via-red-600 to-orange-400' },
                  { id: 'arctic-blue', name: 'Arctic Blue', classes: 'from-cyan-300 via-blue-400 to-blue-600' },
                  { id: 'wild-berry', name: 'Wild Berry', classes: 'from-rose-400 via-fuchsia-500 to-indigo-500' },
                  { id: 'sunny-morning', name: 'Sunny Morning', classes: 'from-amber-200 via-yellow-400 to-orange-500' },
                  { id: 'tropical-forest', name: 'Tropical Forest', classes: 'from-lime-400 via-emerald-500 to-teal-600' },
                  { id: 'mystic-purple', name: 'Mystic Purple', classes: 'from-violet-500 via-purple-500 to-fuchsia-500' },
                  { id: 'pastel-dream', name: 'Pastel Dream', classes: 'from-rose-100 via-teal-200 to-cyan-300' },
                  { id: 'crimson-rose', name: 'Crimson Rose', classes: 'from-red-500 via-rose-600 to-pink-500' },
                  { id: 'blue-lagoon', name: 'Blue Lagoon', classes: 'from-sky-400 via-blue-500 to-cyan-400' },
                  { id: 'autumn-leaves', name: 'Autumn Leaves', classes: 'from-orange-500 via-amber-500 to-yellow-500' },
                  { id: 'minty-fresh', name: 'Minty Fresh', classes: 'from-teal-200 via-emerald-200 to-green-300' },
                  { id: 'lavender-bliss', name: 'Lavender Bliss', classes: 'from-indigo-300 via-purple-400 to-pink-400' },
                  { id: 'cherry-blossom', name: 'Cherry Blossom', classes: 'from-pink-400 via-rose-400 to-red-400' },
                  { id: 'fire-ice', name: 'Fire & Ice', classes: 'from-orange-500 via-red-500 to-cyan-500' },
                  { id: 'emerald-gold', name: 'Emerald Gold', classes: 'from-emerald-400 via-yellow-400 to-amber-500' },
                  { id: 'deep-ocean', name: 'Deep Ocean', classes: 'from-blue-700 via-blue-500 to-cyan-400' },
                  { id: 'sunset-glow', name: 'Sunset Glow', classes: 'from-rose-400 via-orange-400 to-yellow-400' },
                  { id: 'magic-hour', name: 'Magic Hour', classes: 'from-fuchsia-500 via-purple-500 to-indigo-500' },
                  { id: 'toxic-waste', name: 'Toxic Glow', classes: 'from-lime-400 via-green-400 to-emerald-500' },
                  { id: 'berry-smoothie', name: 'Berry Smoothie', classes: 'from-pink-500 via-rose-400 to-red-400' },
                  { id: 'ice-crystal', name: 'Ice Crystal', classes: 'from-cyan-200 via-sky-300 to-blue-300' },
                  { id: 'golden-sand', name: 'Golden Sand', classes: 'from-yellow-300 via-amber-300 to-orange-300' },
                  { id: 'royal-velvet', name: 'Royal Velvet', classes: 'from-indigo-600 via-violet-600 to-purple-600' },
                  { id: 'forest-canopy', name: 'Forest Canopy', classes: 'from-green-500 via-emerald-500 to-teal-500' },
                  { id: 'candy-apple', name: 'Candy Apple', classes: 'from-red-500 via-rose-500 to-pink-500' },
                  { id: 'blue-steel', name: 'Blue Steel', classes: 'from-slate-400 via-blue-500 to-indigo-500' },
                  { id: 'amethyst', name: 'Amethyst', classes: 'from-purple-400 via-fuchsia-400 to-pink-400' },
                  { id: 'peachy-keen', name: 'Peachy Keen', classes: 'from-orange-300 via-red-300 to-rose-300' },
                  { id: 'seafoam', name: 'Seafoam', classes: 'from-teal-300 via-emerald-300 to-cyan-300' },
                  { id: 'volcano', name: 'Volcano', classes: 'from-red-600 via-orange-600 to-yellow-500' },
                  { id: 'starry-night', name: 'Starry Night', classes: 'from-slate-800 via-indigo-600 to-blue-500' },
                  { id: 'copper-patina', name: 'Copper Patina', classes: 'from-amber-600 via-orange-500 to-teal-500' },
                  { id: 'cyberpunk-neon', name: 'Cyber Neon', classes: 'from-fuchsia-600 via-pink-500 to-cyan-500' },
                ].map((grad) => (
                  <button
                    key={grad.id}
                    type="button"
                    onClick={() => setThemeSettings({...themeSettings, heroTitleGradient: grad.classes})}
                    className={`px-4 py-2 rounded-xl text-sm font-extrabold shadow-sm border-2 transition-transform hover:scale-105 active:scale-95 bg-white dark:bg-slate-900 ${themeSettings.heroTitleGradient === grad.classes ? 'border-teal-500 scale-105 ring-2 ring-teal-500/20' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                    title={grad.name}
                  >
                    <span className={`text-transparent bg-clip-text bg-gradient-to-r ${grad.classes}`}>
                      {grad.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hero Banner Background</label>
              <p className="text-[10px] text-slate-400 -mt-2">Choose a gorgeous background for the main Hero Banner on the Home Page.</p>
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { id: 'glass-dark', name: 'Dark Glass', classes: 'bg-slate-900/40 backdrop-blur-md' },
                  { id: 'glass-light', name: 'Light Glass', classes: 'bg-white/10 backdrop-blur-md' },
                  { id: 'glass-teal', name: 'Teal Glass', classes: 'bg-teal-900/40 backdrop-blur-md border-teal-500/30' },
                  { id: 'glass-indigo', name: 'Indigo Glass', classes: 'bg-indigo-900/40 backdrop-blur-md border-indigo-500/30' },
                  { id: 'glass-rose', name: 'Rose Glass', classes: 'bg-rose-900/40 backdrop-blur-md border-rose-500/30' },
                  { id: 'glass-amber', name: 'Amber Glass', classes: 'bg-amber-900/40 backdrop-blur-md border-amber-500/30' },
                  { id: 'glass-fuchsia', name: 'Fuchsia Glass', classes: 'bg-fuchsia-900/40 backdrop-blur-md border-fuchsia-500/30' },
                  { id: 'glass-cyan', name: 'Cyan Glass', classes: 'bg-cyan-900/40 backdrop-blur-md border-cyan-500/30' },
                  { id: 'glass-emerald', name: 'Deep Forest', classes: 'bg-emerald-950/60 backdrop-blur-lg border-emerald-500/20' },
                  { id: 'glass-blue', name: 'Deep Ocean', classes: 'bg-blue-950/60 backdrop-blur-lg border-blue-500/20' },
                  { id: 'glass-black', name: 'Deep Black', classes: 'bg-black/60 backdrop-blur-xl border-white/5' },
                  { id: 'solid-slate', name: 'Solid Slate', classes: 'bg-gradient-to-br from-slate-900 to-slate-800' },
                  { id: 'solid-teal', name: 'Vibrant Teal', classes: 'bg-gradient-to-br from-teal-500 to-emerald-600' },
                  { id: 'solid-blue', name: 'Vibrant Blue', classes: 'bg-gradient-to-br from-blue-600 to-indigo-700' },
                  { id: 'solid-purple', name: 'Vibrant Purple', classes: 'bg-gradient-to-br from-purple-600 to-fuchsia-600' },
                  { id: 'solid-pink', name: 'Vibrant Pink', classes: 'bg-gradient-to-br from-rose-500 to-pink-600' },
                  { id: 'solid-orange', name: 'Vibrant Orange', classes: 'bg-gradient-to-br from-orange-500 to-amber-600' },
                  { id: 'solid-cyber', name: 'Cyber Solid', classes: 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500' },
                  { id: 'solid-sunset', name: 'Sunset Solid', classes: 'bg-gradient-to-r from-red-500 to-orange-500' },
                  { id: 'mystic-teal', name: 'Mystic Teal', classes: 'bg-gradient-to-tl from-slate-800 via-teal-900 to-slate-900' },
                  { id: 'glass-violet', name: 'Deep Violet', classes: 'bg-violet-950/60 backdrop-blur-lg border-violet-500/20' },
                  { id: 'glass-pink', name: 'Deep Pink', classes: 'bg-pink-950/60 backdrop-blur-lg border-pink-500/20' },
                  { id: 'glass-gold', name: 'Deep Gold', classes: 'bg-yellow-950/60 backdrop-blur-lg border-yellow-500/20' },
                  { id: 'frosted-slate', name: 'Frosted Slate', classes: 'bg-slate-800/80 backdrop-blur-xl border-slate-600' },
                  { id: 'frosted-pearl', name: 'Frosted Pearl', classes: 'bg-white/20 backdrop-blur-xl border-white/40' },
                  { id: 'neon-magenta', name: 'Neon Magenta', classes: 'bg-gradient-to-tr from-rose-600 via-pink-600 to-fuchsia-600' },
                  { id: 'neon-green', name: 'Neon Green', classes: 'bg-gradient-to-br from-green-400 to-emerald-600 border border-green-300/30' },
                  { id: 'solar-flare', name: 'Solar Flare', classes: 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 border border-yellow-400/30' },
                  { id: 'midnight-indigo', name: 'Midnight Indigo', classes: 'bg-gradient-to-bl from-indigo-900 via-indigo-800 to-blue-900 border border-indigo-500/30' },
                  { id: 'carbon-fiber', name: 'Carbon Fiber', classes: 'bg-gradient-to-br from-zinc-800 to-neutral-900 border border-zinc-700' },
                  { id: 'synthwave', name: 'Synthwave', classes: 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 border border-fuchsia-400/30' },
                  { id: 'glass-sky', name: 'Sky Glass', classes: 'bg-sky-900/40 backdrop-blur-md border-sky-500/30' },
                  { id: 'glass-lime', name: 'Lime Glass', classes: 'bg-lime-900/40 backdrop-blur-md border-lime-500/30' },
                  { id: 'glass-orange-2', name: 'Orange Glass', classes: 'bg-orange-900/40 backdrop-blur-md border-orange-500/30' },
                  { id: 'glass-purple-2', name: 'Purple Glass', classes: 'bg-purple-900/40 backdrop-blur-md border-purple-500/30' },
                  { id: 'solid-emerald', name: 'Solid Emerald', classes: 'bg-gradient-to-br from-emerald-500 to-teal-700' },
                  { id: 'solid-crimson', name: 'Solid Crimson', classes: 'bg-gradient-to-br from-red-600 to-rose-800' },
                  { id: 'solid-indigo-2', name: 'Solid Indigo', classes: 'bg-gradient-to-br from-indigo-500 to-blue-800' },
                  { id: 'solid-gold', name: 'Solid Gold', classes: 'bg-gradient-to-br from-yellow-400 to-amber-600' },
                  { id: 'solid-fuchsia', name: 'Solid Fuchsia', classes: 'bg-gradient-to-br from-fuchsia-500 to-purple-700' },
                  { id: 'neon-cyan', name: 'Neon Cyan', classes: 'bg-gradient-to-r from-cyan-400 to-blue-500 border border-cyan-300/30' },
                  { id: 'neon-lime', name: 'Neon Lime', classes: 'bg-gradient-to-r from-lime-400 to-green-500 border border-lime-300/30' },
                  { id: 'neon-rose', name: 'Neon Rose', classes: 'bg-gradient-to-r from-rose-400 to-red-500 border border-rose-300/30' },
                  { id: 'dark-galaxy', name: 'Dark Galaxy', classes: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900' },
                  { id: 'dark-forest', name: 'Dark Forest', classes: 'bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900' },
                  { id: 'dark-ocean', name: 'Dark Ocean', classes: 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' },
                  { id: 'dark-volcano', name: 'Dark Volcano', classes: 'bg-gradient-to-br from-slate-900 via-red-900 to-slate-900' },
                  { id: 'dark-gold', name: 'Dark Gold', classes: 'bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900' },
                  { id: 'mesh-1', name: 'Mesh Purple', classes: 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 opacity-90' },
                  { id: 'mesh-2', name: 'Mesh Orange', classes: 'bg-gradient-to-tr from-orange-500 via-rose-500 to-pink-600 opacity-90' }
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => setThemeSettings({...themeSettings, heroLogoBackground: bg.classes})}
                    className={`px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 text-white flex items-center justify-center border-2 ${themeSettings.heroLogoBackground === bg.classes ? 'border-teal-500 scale-105 ring-2 ring-teal-500/20' : 'border-transparent hover:border-white/20'} ${bg.classes}`}
                    title={bg.name}
                  >
                    {bg.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custom Background Photo (Optional)</label>
              <p className="text-[10px] text-slate-400">Paste an image URL here to override the default glossy background.</p>
              <input 
                type="url" 
                value={themeSettings.backgroundImageUrl || ''}
                onChange={(e) => setThemeSettings({...themeSettings, backgroundImageUrl: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-fuchsia-500 rounded-xl py-2.5 px-4 text-sm outline-none transition-colors"
                placeholder="https://example.com/gorgeous-background.jpg"
              />
            </div>

            <div className="flex justify-end mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <button type="submit" className="px-6 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2">
                <Save className="w-4 h-4" />
                {savingTheme ? 'Applying...' : 'Apply Theme'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

