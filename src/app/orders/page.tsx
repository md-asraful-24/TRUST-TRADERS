"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Layers
} from "lucide-react";
import { mockDb, isMockMode, supabase } from "@/lib/supabase";
import { useAdminStatus } from "@/lib/authUtils";

export default function OrdersListPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isSuperAdmin } = useAdminStatus();

  const handleDelete = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this purchase order?")) return;

    try {
      if (isMockMode) {
        const updated = orders.filter((o: any) => o.id !== orderId);
        await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } else {
        const res = await fetch(`/api/orders?id=${orderId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
      }
      setOrders(orders.filter((o) => o.id !== orderId));
      setFilteredOrders(filteredOrders.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("Failed to delete order:", err);
      alert("Failed to delete purchase order. Ensure you have permission.");
    }
  };

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  
  // Sort State
  const [sortField, setSortField] = useState("order_date");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        let ordersList: any[] = [];
        if (data && data.length > 0) {
          ordersList = data;
        } else if (isMockMode) {
          ordersList = mockDb.getOrders();
        }
        
        setOrders(ordersList);
        setFilteredOrders(ordersList);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  // Handle Filtering & Searching
  useEffect(() => {
    let result = [...orders];

    // Search Query (Customer or Order Number)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.customer_name.toLowerCase().includes(q) ||
          o.order_number.toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (statusFilter !== "All") {
      result = result.filter((o) => o.status === statusFilter);
    }

    // Date Filter
    if (dateFilter) {
      result = result.filter((o) => o.order_date === dateFilter);
    }

    // Product Filter
    if (productFilter.trim()) {
      const p = productFilter.toLowerCase();
      result = result.filter((o) =>
        o.items?.some((item: any) =>
          item.product_name.toLowerCase().includes(p)
        )
      );
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle numbers vs strings
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    setFilteredOrders(result);
  }, [searchQuery, statusFilter, dateFilter, productFilter, sortField, sortAsc, orders]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-semibold">Retrieving sales register...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50">Purchase Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create, track, and update chemical procurement orders.
          </p>
        </div>
        <Link
          href="/orders/new"
          className="inline-flex items-center justify-center gap-1.5 px-4.5 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10 cursor-pointer active:scale-95 text-center"
        >
          <Plus className="w-4 h-4" />
          Create New Order
        </Link>
      </div>

      {/* Filter panel */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700/60 pb-3">
          <Filter className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
          <span>Search & Filter Operations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Text Search */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Order / Client</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Apex Chem"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 pl-9 pr-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Product Search */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Search Chemical Product</label>
            <div className="relative">
              <Layers className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Sulfuric Acid"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 pl-9 pr-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Date filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order Date</label>
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

      {/* Orders List Container */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center">
            <Layers className="w-12 h-12 text-slate-350 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No matching orders found.</p>
            <p className="text-xs text-slate-400 mt-1">Refine your search criteria or register a new purchase order.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <th
                      onClick={() => toggleSort("order_number")}
                      className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      <div className="flex items-center gap-1">
                        Order Number
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
                      onClick={() => toggleSort("order_date")}
                      className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      <div className="flex items-center gap-1">
                        Date
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">
                      Chemical Product
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider">
                      Gallons
                    </th>
                    <th
                      onClick={() => toggleSort("total_amount")}
                      className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      <div className="flex items-center gap-1">
                        Total Amount
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider text-center">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredOrders.map((order) => {
                    const firstItem = order.items?.[0];
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-750/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                          {order.order_number}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-650 dark:text-slate-350 max-w-[180px] truncate">
                          {order.customer_name}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                          {order.order_date}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-750 dark:text-slate-300 font-semibold truncate max-w-[180px]">
                          {firstItem?.product_name || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-bold">
                          {firstItem?.quantity ? `${Number(firstItem.quantity).toLocaleString()} Gallons` : "0 Gallons"}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-200 text-sm">
                          BDT {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold ${
                              order.status === "Completed"
                                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                                : order.status === "Pending"
                                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                                : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {order.status === "Completed" ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : order.status === "Pending" ? (
                              <Clock className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/orders/${order.id}`}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg text-slate-550 dark:text-slate-400 hover:text-teal-655 transition-colors"
                              title="Edit / View Details"
                            >
                              <Edit className="w-4.5 h-4.5" />
                            </Link>
                          {isSuperAdmin && (
                              <button
                                onClick={() => handleDelete(order.id)}
                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title="Delete Order"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredOrders.map((order) => {
                const firstItem = order.items?.[0];
                return (
                  <div key={order.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100">{order.order_number}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{order.order_date}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          order.status === "Completed"
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                            : order.status === "Pending"
                            ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                            : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-slate-550 dark:text-slate-400 font-medium">
                        Customer: <span className="font-bold text-slate-700 dark:text-slate-350">{order.customer_name}</span>
                      </p>
                      <p className="text-slate-550 dark:text-slate-400 font-medium">
                        Chemical: <span className="font-bold text-slate-700 dark:text-slate-300">{firstItem?.product_name || "N/A"}</span>
                      </p>
                      <p className="text-slate-555 dark:text-slate-400 font-medium">
                        Quantity: <span className="font-bold text-slate-700 dark:text-slate-300">{firstItem?.quantity ? `${Number(firstItem.quantity).toLocaleString()} Gallons` : "0 Gallons"}</span>
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-700/40">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        BDT {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Manage
                        </Link>
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="inline-flex items-center justify-center p-1.5 bg-rose-50 dark:bg-rose-955/20 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-lg transition-all cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
