"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  FileText,
  Trash2,
  Calendar,
  Layers,
  Printer
} from "lucide-react";
import { mockDb, isMockMode, supabase } from "@/lib/supabase";
import { useAdminStatus } from "@/lib/authUtils";

export default function ChalansListPage() {
  const { isAdmin, isSuperAdmin } = useAdminStatus();
  const [chalans, setChalans] = useState<any[]>([]);
  const [filteredChalans, setFilteredChalans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  // Sort State
  const [sortField, setSortField] = useState("chalan_date");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    async function loadChalans() {
      try {
        const res = await fetch('/api/chalans');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        let chalansList: any[] = [];
        if (data && data.length > 0) {
          chalansList = data;
        } else if (isMockMode) {
          chalansList = mockDb.getChalans();
        }
        
        setChalans(chalansList);
        setFilteredChalans(chalansList);
      } catch (err) {
        console.error("Error fetching chalans:", err);
      } finally {
        setLoading(false);
      }
    }
    loadChalans();
  }, []);

  // Handle Filtering & Searching
  useEffect(() => {
    let result = [...chalans];

    // Search Query (Customer or Chalan SL No)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.customer_name.toLowerCase().includes(q) ||
          c.chalan_number.toLowerCase().includes(q)
      );
    }

    // Date Filter
    if (dateFilter) {
      result = result.filter((c) => c.chalan_date === dateFilter);
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    setFilteredChalans(result);
  }, [searchQuery, dateFilter, sortField, sortAsc, chalans]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleDelete = async (chalanId: string) => {
    if (!confirm("Are you sure you want to delete this chalan?")) return;
    try {
      if (isMockMode) {
        // Fallback to local delete
        const updatedChalans = chalans.filter((c) => c.id !== chalanId);
        await fetch('/api/chalans', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedChalans)
        });
      } else {
        const res = await fetch(`/api/chalans?id=${chalanId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
      }
      setChalans(chalans.filter((c) => c.id !== chalanId));
      setFilteredChalans(filteredChalans.filter((c) => c.id !== chalanId));
    } catch (err) {
      console.error("Error deleting chalan:", err);
      alert("Failed to delete chalan. Ensure you have permission.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-semibold">Opening delivery registers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50">Delivery Chalans</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-0">
            Generate and print delivery chalan notes for chemical dispatches.
          </p>
        </div>
        <Link
          href="/chalans/new"
          className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 px-4 py-2.5 sm:py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-teal-600/10 cursor-pointer active:scale-95 text-center"
        >
          <Plus className="w-4 h-4" />
          Create New Chalan
        </Link>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <Filter className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-teal-600 dark:text-teal-400" />
          <span>Search & Filter Operations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {/* Text Search */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Chalan / Customer</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. 001 or Apex Chem"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 pl-9 pr-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Date filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dispatch Date</label>
            <div className="relative">
              <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 pl-3 pr-9 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Chalans List Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredChalans.length === 0 ? (
          <div className="py-12 text-center">
            <Layers className="w-12 h-12 text-slate-350 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No matching chalans found.</p>
            <p className="text-xs text-slate-400 mt-1">Refine your search criteria or register a new delivery chalan.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <th
                      onClick={() => toggleSort("chalan_number")}
                      className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      <div className="flex items-center gap-1">
                        SL No
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("customer_name")}
                      className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      <div className="flex items-center gap-1">
                        Company Name
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th
                      onClick={() => toggleSort("chalan_date")}
                      className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      <div className="flex items-center gap-1">
                        Date
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">
                      Delivery Address
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">
                      Goods Summary
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredChalans.map((chalan) => (
                    <tr key={chalan.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-750/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {chalan.chalan_number}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                        {chalan.customer_name}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-550 dark:text-slate-400 font-bold">
                        {chalan.chalan_date}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title={chalan.delivery_address}>
                        {chalan.delivery_address}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col gap-0.5">
                          {chalan.items?.map((item: any, idx: number) => (
                            <span key={idx} className="truncate max-w-[200px]">
                              • {item.product_name} ({item.quantity} {item.unit})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link
                            href={`/chalans/${chalan.id}`}
                            className="p-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/20 dark:hover:bg-teal-900/40 text-teal-650 dark:text-teal-400 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                            title="Print / View"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print / View</span>
                          </Link>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDelete(chalan.id)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer border-none bg-transparent"
                              title="Delete Chalan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredChalans.map((chalan) => (
                <div key={chalan.id} className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">SL: {chalan.chalan_number}</p>
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{chalan.chalan_date}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-slate-500 dark:text-slate-400">
                      Company: <span className="font-semibold text-slate-700 dark:text-slate-350">{chalan.customer_name}</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Address: <span className="font-semibold text-slate-700 dark:text-slate-350">{chalan.delivery_address}</span>
                    </p>
                    <div className="text-slate-450 dark:text-slate-500 pl-2 border-l border-slate-200 dark:border-slate-700">
                      {chalan.items?.map((item: any, idx: number) => (
                        <p key={idx}>
                          {item.product_name} - {item.quantity} {item.unit}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-700/40">
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDelete(chalan.id)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer border-none bg-transparent"
                        title="Delete Chalan"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                    <Link
                      href={`/chalans/${chalan.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-650 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all ml-auto"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print / View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
