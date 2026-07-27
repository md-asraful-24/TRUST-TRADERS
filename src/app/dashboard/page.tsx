"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";
import { mockDb, isMockMode, supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        let ordersList: any[] = [];

        if (isMockMode) {
          const res = await fetch('/api/orders');
          ordersList = await res.json();
          if (!ordersList || ordersList.length === 0) ordersList = mockDb.getOrders();
        } else {
          // Fetch from Supabase
          const { data: dbOrders } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .order("created_at", { ascending: false });

          ordersList = dbOrders || [];
        }

        // Calculate statistics
        const completed = ordersList.filter((o) => o.status === "Completed");
        const pending = ordersList.filter((o) => o.status === "Pending");
        const totalRev = ordersList
          .filter((o) => o.status !== "Cancelled")
          .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

        setStats({
          totalOrders: ordersList.length,
          completedOrders: completed.length,
          pendingOrders: pending.length,
          totalRevenue: totalRev,
        });

        setRecentOrders(ordersList.slice(0, 5));
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-semibold">Compiling dashboard telemetry...</p>
      </div>
    );
  }

  // Sample data for custom SVG chart (monthly sales trend)
  const chartData = [35, 48, 62, 51, 80, 95];
  const chartMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const maxVal = Math.max(...chartData);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50">Factory Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time chemical orders, dispatch chalans, and certificate archives.
          </p>
        </div>

        {/* Quick actions bar */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Order
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-bl-full group-hover:scale-110 transition-transform duration-350" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Gross Revenue</span>
            <span className="p-2 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              BDT {stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mt-1.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.4% from last month</span>
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full group-hover:scale-110 transition-transform duration-350" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Orders</span>
            <span className="p-2 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.totalOrders}</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1.5 flex items-center gap-2">
              <span className="text-teal-600 dark:text-teal-400 font-bold">{stats.completedOrders} Completed</span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold">{stats.pendingOrders} Pending</span>
            </p>
          </div>
        </div>

        {/* Status Tracker */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full group-hover:scale-110 transition-transform duration-350" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completion Rate</span>
            <span className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1.5">
              Efficiency score based on status
            </p>
          </div>
        </div>
      </div>

      {/* Sales Trend Chart (Custom Responsive SVG) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Factory Sales Trend</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Monthly gross chemical distributions (in thousands)</p>
          </div>
          <div className="text-xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/30 px-3 py-1 rounded-full border border-teal-200/30">
            H1 Report
          </div>
        </div>

        {/* Responsive Chart Area */}
        <div className="w-full h-64 relative">
          <svg className="w-full h-full" viewBox="0 0 600 220" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="20" x2="600" y2="20" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-700/40" />
            <line x1="0" y1="70" x2="600" y2="70" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-700/40" />
            <line x1="0" y1="120" x2="600" y2="120" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-700/40" />
            <line x1="0" y1="170" x2="600" y2="170" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-700/40" />

            {/* SVG Path line representing trend */}
            <path
              d={`M 50,${200 - (chartData[0] / maxVal) * 160} 
                  L 150,${200 - (chartData[1] / maxVal) * 160} 
                  L 250,${200 - (chartData[2] / maxVal) * 160} 
                  L 350,${200 - (chartData[3] / maxVal) * 160} 
                  L 450,${200 - (chartData[4] / maxVal) * 160} 
                  L 550,${200 - (chartData[5] / maxVal) * 160}`}
              fill="none"
              stroke="url(#chartGradient)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Gradient definition for graph line */}
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="50%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>

            {/* Highlight nodes */}
            {chartData.map((val, idx) => {
              const cx = 50 + idx * 100;
              const cy = 200 - (val / maxVal) * 160;
              return (
                <g key={idx} className="group/node">
                  <circle
                    cx={cx}
                    cy={cy}
                    r="6"
                    className="fill-teal-500 stroke-white dark:stroke-slate-800 stroke-[2] shadow-sm hover:r-8 transition-all cursor-pointer"
                  />
                  <text
                    x={cx}
                    y={cy - 12}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-slate-500 dark:fill-slate-400 pointer-events-none"
                  >
                    {val}k
                  </text>
                </g>
              );
            })}
          </svg>

          {/* X Axis labels */}
          <div className="flex justify-between px-10 pt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
            {chartMonths.map((m, idx) => (
              <span key={idx}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-between w-full">
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Recent Purchase Orders</h2>
            <Link
              href="/orders"
              className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-0.5"
            >
              View All
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/60 pb-3">
                  <th className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase pb-2">Order No</th>
                  <th className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase pb-2">Customer</th>
                  <th className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase pb-2">Total</th>
                  <th className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40 text-xs">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">No recent orders.</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30">
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">
                        <Link href={`/orders/${order.id}`} className="hover:text-teal-600">
                          {order.order_number.replace("ORD-", "")}
                        </Link>
                      </td>
                      <td className="py-3 font-medium text-slate-500 dark:text-slate-400 max-w-[140px] truncate">
                        {order.customer_name}
                      </td>
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">
                        ${Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            order.status === "Completed"
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                              : order.status === "Pending"
                              ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                              : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {order.status === "Completed" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : order.status === "Pending" ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
