"use client";

import React, { useState, useEffect } from 'react';
import { FileText, Save, Plus, ChevronDown, Download, Building2, Trash2, Edit, Printer, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { mockDb } from '@/lib/supabase';
import { useAdminStatus } from '@/lib/authUtils';

type Transaction = {
  id: string;
  company: string;
  date: string; // YYYY-MM-DD
  description: string;
  product_name?: string;
  unit?: string;
  quantity?: number;
  amount: number; // + for due/goods taken, - for paid
  document_url?: string;
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [chemicals, setChemicals] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [openedMonth, setOpenedMonth] = useState<string | null>(null);

  useEffect(() => {
    setOpenedMonth(null);
  }, [selectedCompany]);
  
  // Form State
  const [dateInput, setDateInput] = useState('');
  const [description, setDescription] = useState('');
  const [productName, setProductName] = useState('');
  const [unit, setUnit] = useState('Gallon');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  const { isSuperAdmin } = useAdminStatus();

  useEffect(() => {
    // Load companies
    const loadCompanies = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.companies && data.companies.length > 0) {
          setCompanies(data.companies);
          setSelectedCompany(data.companies[0]);
        } else {
          const comps = mockDb.getCompanies();
          setCompanies(comps);
          if (comps.length > 0) setSelectedCompany(comps[0]);
        }
        
        if (data.chemicals) {
          setChemicals(data.chemicals);
        } else if (data.companyInfo && data.companyInfo.chemicals) {
          setChemicals(data.companyInfo.chemicals);
        } else {
          setChemicals(mockDb.getChemicals());
        }
      } catch (err) {
        const comps = mockDb.getCompanies();
        setCompanies(comps);
        if (comps.length > 0) setSelectedCompany(comps[0]);
        setChemicals(mockDb.getChemicals());
      }
    };
    loadCompanies();

    // Default date
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    
    // Default date
    const dd = String(now.getDate()).padStart(2, '0');
    setDateInput(`${yyyy}-${mm}-${dd}`);

    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions?t=' + new Date().getTime(), { cache: 'no-store' });
      const data = await res.json();
      
      // Parse document_url if it contains JSON to avoid DB schema changes
      const parsedData = data.map((tx: any) => {
        if (tx.document_url && tx.document_url.startsWith('{"_meta":')) {
          try {
            const meta = JSON.parse(tx.document_url);
            return {
              ...tx,
              product_name: meta.product_name,
              unit: meta.unit,
              quantity: meta.quantity,
              document_url: meta.original_url || null
            };
          } catch (e) {
            return tx;
          }
        }
        return tx;
      });
      
      setTransactions(parsedData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !dateInput || !description || !amount) return;
    
    setLoading(true);
    const formattedDate = dateInput;

    const parsedAmount = Number(amount.replace(/,/g, ''));
    const metaObj = {
      _meta: true,
      product_name: productName,
      unit,
      quantity: quantity ? Number(quantity) : undefined,
      original_url: null 
    };

    const newTx = {
      company: selectedCompany,
      date: formattedDate,
      description,
      amount: parsedAmount,
      document_url: JSON.stringify(metaObj)
    };

    try {
      if (editingId) {
        const res = await fetch('/api/transactions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...newTx, id: editingId })
        });
        if (res.ok) {
          await fetchTransactions();
          setEditingId(null);
          setDescription('');
          setProductName('');
          setQuantity('');
          setUnit('Gallon');
          setAmount('');
        }
      } else {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTx)
        });
        if (res.ok) {
          await fetchTransactions();
          setDescription('');
          setProductName('');
          setQuantity('');
          setUnit('Gallon');
          setAmount('');
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই রেকর্ডটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchTransactions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (tx: Transaction) => {
    setEditingId(tx.id);
    setDateInput(tx.date);
    setDescription(tx.description);
    setProductName(tx.product_name || '');
    setUnit(tx.unit || 'Gallon');
    setQuantity(tx.quantity ? String(tx.quantity) : '');
    setAmount(tx.amount.toLocaleString('en-IN'));
    setSelectedCompany(tx.company);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Allow only digits and a single minus sign at the start
    val = val.replace(/(?!^)-/g, '').replace(/[^\d-]/g, '');
    
    if (val === '-' || val === '') {
      setAmount(val);
      return;
    }
    
    const isNegative = val.startsWith('-');
    const numericVal = val.replace('-', '');
    if (numericVal) {
      const formatted = Number(numericVal).toLocaleString('en-IN');
      setAmount(isNegative ? '-' + formatted : formatted);
    } else {
      setAmount('');
    }
  };



  // Sort all transactions by date
  const sortedTransactions = transactions
    .filter(t => t.company === selectedCompany)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Extract unique months chronologically, then reverse to show newest first
  const uniqueMonths = Array.from(new Set(sortedTransactions.map(tx => {
    const txDate = new Date(tx.date);
    return `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
  }))).sort().reverse();

  if (uniqueMonths.length === 0) {
    const now = new Date();
    uniqueMonths.push(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  }

  const getTransactionColorClass = (tx: Transaction) => {
    if (tx.description.includes('কে মাল দিছি') || tx.description.includes('মাল দিছি')) {
      return 'text-emerald-600 dark:text-emerald-400 print:text-emerald-600';
    }
    if (tx.description.includes('আমাদের টাকা দিছে') || tx.description.includes('টাকা দিছে')) {
      return 'text-rose-600 dark:text-rose-400 print:text-rose-600';
    }
    return tx.amount >= 0 
      ? 'text-rose-600 dark:text-rose-400 print:text-rose-600'
      : 'text-emerald-500 dark:text-emerald-400 print:text-emerald-500';
  };

  const monthTablesData = uniqueMonths.map(monthStr => {
    let balanceForward = 0;
    const currentMonthTx: Transaction[] = [];
    
    sortedTransactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (txMonth < monthStr) {
        balanceForward += tx.amount;
      } else if (txMonth === monthStr) {
        currentMonthTx.push(tx);
      }
    });

    let runningBalance = balanceForward;
    const tableRows = currentMonthTx.map(tx => {
      runningBalance += tx.amount;
      return { ...tx, runningBalance };
    });

    const totalDue = runningBalance;
    const dueText = totalDue >= 0 
      ? `${selectedCompany || 'কোম্পানি'} মোট পাবে` 
      : `আমরা ${selectedCompany || 'কোম্পানি'}-এর কাছে মোট পাব`;

    const [y, m] = monthStr.split('-').map(Number);
    const lastDayPrevMonthDate = new Date(y, m - 1, 0);
    const lastDayFormatted = lastDayPrevMonthDate.toLocaleDateString('en-GB');

    const balanceForwardText = balanceForward >= 0
      ? `পূর্বের জের (${lastDayFormatted}): ${selectedCompany} পাবে`
      : `পূর্বের জের (${lastDayFormatted}): আমরা পাব`;

    return {
      monthStr,
      balanceForward,
      balanceForwardText,
      tableRows,
      totalDue,
      dueText
    };
  });

  const activeMonthData = openedMonth ? monthTablesData.find(d => d.monthStr === openedMonth) : null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <FileText className="w-8 h-8 text-teal-500" />
          হিসাবের খাতা
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-500" />
            কোম্পানি ও মাস নির্বাচন
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                কোম্পানি নির্বাচন করুন
              </label>
              <select 
                value={selectedCompany} 
                onChange={e => setSelectedCompany(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="">-- নির্বাচন করুন --</option>
                {companies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Add Transaction Form */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-teal-500" />
            {editingId ? 'হিসাব পরিবর্তন করুন' : 'নতুন হিসাব যোগ করুন'}
          </h2>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  তারিখ
                </label>
                <input 
                  type="date"
                  value={dateInput}
                  onChange={e => setDateInput(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  বিবরণ / ধরন (মাল নেওয়া / টাকা দেওয়া)
                </label>
                <input 
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  placeholder="বিবরণ লিখুন..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/50"
                />
                {selectedCompany && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button 
                      type="button"
                      onClick={() => {
                        setDescription(`${selectedCompany} এর কাছ থেকে মাল নেওয়া`);
                        if (amount.startsWith('-')) setAmount(amount.substring(1));
                      }}
                      className="px-3 py-1 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 text-xs font-bold rounded-full border border-teal-200 dark:border-teal-500/20 hover:bg-teal-100 dark:hover:bg-teal-500/20"
                    >
                      + মাল নেওয়া
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setDescription(`${selectedCompany} কে মাল দিছি`);
                        if (amount.startsWith('-')) setAmount(amount.substring(1));
                      }}
                      className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                    >
                      + মাল দিছি
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setDescription(`${selectedCompany} কে টাকা দিছি`);
                        if (amount && !amount.startsWith('-')) setAmount('-' + amount);
                        else if (!amount) setAmount('-');
                      }}
                      className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                    >
                      + টাকা দেওয়া
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setDescription(`${selectedCompany} আমাদের টাকা দিছে`);
                        if (amount && !amount.startsWith('-')) setAmount('-' + amount);
                        else if (!amount) setAmount('-');
                      }}
                      className="px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-full border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20"
                    >
                      + টাকা দিছে
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setDescription(`${selectedCompany} পাবে`);
                        if (amount.startsWith('-')) setAmount(amount.substring(1));
                      }}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      + পাবে
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  প্রোডাক্ট / কেমিক্যাল নাম
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    value={productName}
                    onChange={e => {
                      setProductName(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                    placeholder="যেমন: Hydrochloric Acid..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 pr-10"
                  />
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowProductDropdown(!showProductDropdown);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
                
                {showProductDropdown && chemicals.length > 0 && (
                  <ul className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {chemicals.filter(c => c.toLowerCase().includes(productName.toLowerCase())).map(c => (
                      <li 
                        key={c}
                        onClick={() => {
                          setProductName(c);
                          setShowProductDropdown(false);
                        }}
                        className="px-4 py-2.5 hover:bg-teal-50 dark:hover:bg-teal-900/30 cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                      >
                        {c}
                      </li>
                    ))}
                    {chemicals.filter(c => c.toLowerCase().includes(productName.toLowerCase())).length === 0 && (
                      <li className="px-4 py-3 text-sm text-slate-500 italic text-center">
                        কোনো রেজাল্ট পাওয়া যায়নি। নতুন টাইপ করুন।
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  পরিমাণ
                </label>
                <input 
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="কতটুকু..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  ইউনিট
                </label>
                <select 
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/50"
                >
                  <option value="Gallon">Gallon</option>
                  <option value="Kg">Kg</option>
                  <option value="Liter">Liter</option>
                  <option value="Drum">Drum</option>
                  <option value="Pcs">Pcs</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  টাকার পরিমাণ (মাল নিলে +, টাকা দিলে -)
                </label>
                <input 
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
              <div>
                <div className="flex gap-2 w-full">
                  <button
                    type="submit"
                    disabled={loading || !selectedCompany}
                    className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {editingId ? 'আপডেট করুন' : 'সেভ করুন'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setDescription('');
                        setAmount('');
                      }}
                      className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all flex items-center justify-center"
                    >
                      বাতিল
                    </button>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              * মাল নিলে (পাওনা হলে) সাধারণ সংখ্যা লিখুন। আর টাকা পরিশোধ করলে সংখ্যার আগে মাইনাস (-) চিহ্ন দিন।
            </p>
          </form>
        </div>
      </div>

      {/* Month List UI */}
      {selectedCompany && !openedMonth && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden mt-8">
          <div className="flex items-center gap-2 p-5 text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/60">
            <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>সকল মাসের হিসাব (All Months)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">মাস ও বছর</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">মোট লেনদেন</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">সর্বশেষ জের (Total Due)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {monthTablesData.map((data) => {
                  const [y, m] = data.monthStr.split('-');
                  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
                  const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  
                  return (
                    <tr key={data.monthStr} className="hover:bg-slate-50/40 dark:hover:bg-slate-750/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {label} ({data.monthStr})
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-semibold">
                        {data.tableRows.length} টি হিসাব এন্ট্রি
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-200 text-sm">
                        <span className={data.totalDue >= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}>
                           {Math.abs(data.totalDue).toLocaleString('en-IN')}/-
                        </span>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">{data.dueText}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setOpenedMonth(data.monthStr)}
                          className="p-2 px-4 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-900/40 text-teal-650 dark:text-teal-400 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          ওপেন করুন (View)
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Spreadsheet UI */}
      {selectedCompany && activeMonthData ? (
        <div className="print-section mt-8">
          <div className="mb-4 flex items-center justify-between print:hidden">
             <button
                onClick={() => setOpenedMonth(null)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-all shadow-sm"
             >
                <ChevronLeft className="w-4 h-4" />
                ফিরে যান (Back to List)
             </button>
          </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm print:shadow-none print:border print:border-slate-300 print:rounded-none">
          <div className="bg-slate-100 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-800 relative print:bg-transparent print:border-none flex justify-between items-center print:flex-col print:justify-center print:pb-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white print:text-black print:text-center print:w-full">
              {selectedCompany} - হিসাবের খাতা ({activeMonthData.monthStr})
            </h2>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 print:hidden"
            >
              <Download className="w-4 h-4" />
              ডাউনলোড / প্রিন্ট
            </button>
          </div>
          
          <div className="overflow-x-auto print:mt-2">
            <table className="w-full text-left border-collapse print:border print:border-slate-300">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 print:border-b print:border-slate-300">
                  <th className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300 w-28 border-r border-slate-200 dark:border-slate-700 print:text-black print:border-slate-300 print:border">তারিখ</th>
                  <th className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 print:text-black print:border-slate-300 print:border">প্রোডাক্ট</th>
                  <th className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 print:text-black print:border-slate-300 print:border">পরিমাণ</th>
                  <th className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 print:text-black print:border-slate-300 print:border">বিবরণ</th>
                  <th className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300 w-36 text-right border-r border-slate-200 dark:border-slate-700 print:text-black print:border-slate-300 print:border">টাকা</th>
                  <th className="p-3 text-sm font-bold text-slate-700 dark:text-slate-300 w-16 text-center print:hidden">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {/* Previous Balance Row as First Row of Table */}
                {activeMonthData.balanceForward !== 0 && (() => {
                  const [y, m] = activeMonthData.monthStr.split('-').map(Number);
                  const lastDayPrevMonthDate = new Date(y, m - 1, 0);
                  const prevMonthDateFormatted = lastDayPrevMonthDate.toLocaleDateString('en-GB');
                  const isPositive = activeMonthData.balanceForward >= 0;
                  
                  return (
                    <tr key="prev-balance-row" className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors print:border-b print:border-slate-300">
                      <td className="p-3 text-sm font-medium text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 print:text-black print:border-slate-300 print:border">
                        {prevMonthDateFormatted}
                      </td>
                      <td className="p-3 text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 print:text-black print:border-slate-300 print:border">
                        <span className="text-slate-400">-</span>
                      </td>
                      <td className="p-3 text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 print:text-black print:border-slate-300 print:border">
                        <span className="text-slate-400">-</span>
                      </td>
                      <td className={`p-3 text-sm font-medium border-r border-slate-100 dark:border-slate-800 print:border-slate-300 print:border ${isPositive ? 'text-rose-600 dark:text-rose-400 print:text-rose-600' : 'text-emerald-500 dark:text-emerald-400 print:text-emerald-500'}`}>
                        {activeMonthData.balanceForwardText}
                      </td>
                      <td className={`p-3 text-sm font-bold text-right border-r border-slate-100 dark:border-slate-800 print:border-slate-300 print:border ${isPositive ? 'text-rose-600 dark:text-rose-400 print:text-rose-600' : 'text-emerald-500 dark:text-emerald-400 print:text-emerald-500'}`}>
                        {isPositive ? '' : '- '}{Math.abs(activeMonthData.balanceForward).toLocaleString('en-IN')}/-
                      </td>
                      <td className="p-4 text-center print:hidden"></td>
                    </tr>
                  );
                })()}

                {/* Transactions */}
                {activeMonthData.tableRows.map((tx, idx) => (
                  <tr key={tx.id || idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors print:border-b print:border-slate-300">
                    <td className="p-3 text-sm font-medium text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 print:text-black print:border-slate-300 print:border">
                      {new Date(tx.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="p-3 text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 print:text-black print:border-slate-300 print:border">
                      {tx.product_name ? <span className="font-bold">{tx.product_name}</span> : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="p-3 text-sm font-medium text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 print:text-black print:border-slate-300 print:border">
                      {tx.quantity ? <span>{tx.quantity} {tx.unit}</span> : <span className="text-slate-400">-</span>}
                    </td>
                    <td className={`p-3 text-sm font-medium border-r border-slate-100 dark:border-slate-800 print:border-slate-300 print:border ${getTransactionColorClass(tx)}`}>
                      {tx.description}
                    </td>
                    <td className={`p-3 text-sm font-bold text-right border-r border-slate-100 dark:border-slate-800 print:border-slate-300 print:border ${getTransactionColorClass(tx)}`}>
                      {tx.amount > 0 ? '' : '- '}{Math.abs(tx.amount).toLocaleString('en-IN')}/-
                    </td>
                    <td className="p-4 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditClick(tx)}
                          className="p-2 rounded-lg text-slate-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors cursor-pointer"
                          title="পরিবর্তন করুন"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="ডিলিট করুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-slate-50 dark:bg-slate-800/50 print:border-t print:border-slate-300">
                  <td colSpan={4} className="p-3 text-right text-base font-extrabold text-slate-900 dark:text-white print:border-slate-300 print:border print:border-r print:text-black">
                    {activeMonthData.dueText}
                  </td>
                  <td className={`p-3 text-lg font-black text-right border-r border-slate-300 dark:border-slate-600 print:border-slate-300 print:border ${activeMonthData.totalDue >= 0 ? 'text-rose-600 dark:text-rose-400 print:text-rose-600' : 'text-emerald-500 dark:text-emerald-400 print:text-emerald-500'}`}>
                    {Math.abs(activeMonthData.totalDue).toLocaleString('en-IN')}/-
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        </div>
      ) : !selectedCompany && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">কোনো কোম্পানি নির্বাচিত হয়নি</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">হিসাব দেখতে উপরের তালিকা থেকে একটি কোম্পানি নির্বাচন করুন।</p>
        </div>
      )}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
