"use client";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, ShoppingBag, Info, CheckCircle, Clock, XCircle, FileText, Trash2 } from "lucide-react";
import { mockDb, isMockMode, supabase } from "@/lib/supabase";
import { useAdminStatus } from "@/lib/authUtils";

export default function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: orderId } = use(params);
  const { isAdmin } = useAdminStatus();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this purchase order?")) return;

    try {
      setSaving(true);
      if (isMockMode) {
        const res = await fetch('/api/orders');
        let orders = await res.json();
        if (!orders || orders.length === 0) orders = mockDb.getOrders();
        const updated = orders.filter((o: any) => o.id !== orderId);
        await fetch('/api/orders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
        router.push("/orders");
      } else {
        // Delete items
        const { error: itemsError } = await supabase
          .from("order_items")
          .delete()
          .eq("order_id", orderId);
        if (itemsError) throw itemsError;

        // Delete order
        const { error: orderError } = await supabase
          .from("orders")
          .delete()
          .eq("id", orderId);
        if (orderError) throw orderError;

        router.push("/orders");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete order.");
      setSaving(false);
    }
  };

  // States
  const [customerName, setCustomerName] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [status, setStatus] = useState("Pending");
  const [notes, setNotes] = useState("");
  const [associatedDocs, setAssociatedDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Simplified Item States
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<string>("");

  useEffect(() => {
    async function loadOrderDetails() {
      try {
        let orderData: any = null;
        let docsData: any[] = [];

        const res = await fetch('/api/orders');
        const allOrders = await res.json();
        const dbOrder = allOrders.find((o: any) => o.id === orderId);

        if (dbOrder) {
          orderData = dbOrder;
          
          const docsRes = await fetch('/api/documents');
          const allDocs = await docsRes.json();
          docsData = allDocs.filter((d: any) => d.associated_type === "order" && d.associated_id === orderId);
        }

        if (!orderData) {
          setError("Order not found.");
          setLoading(false);
          return;
        }

        setCustomerName(orderData.customer_name);
        setOrderDate(orderData.order_date);
        setOrderNumber(orderData.order_number);
        setStatus(orderData.status);
        setNotes(orderData.notes || "");

        const firstItem = orderData.items?.[0];
        if (firstItem) {
          setProductName(firstItem.product_name);
          setQuantity(firstItem.quantity.toString());
          setTotalAmount(firstItem.total ? firstItem.total.toString() : orderData.total_amount.toString());
        } else {
          setProductName("");
          setQuantity("");
          setTotalAmount(orderData.total_amount ? orderData.total_amount.toString() : "");
        }

        setAssociatedDocs(docsData);
      } catch (err: any) {
        setError(err.message || "Failed to load order.");
      } finally {
        setLoading(false);
      }
    }

    loadOrderDetails();
  }, [orderId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Basic Validations
    if (!customerName.trim()) {
      setError("Please specify a customer name.");
      return;
    }
    if (!productName.trim()) {
      setError("Please specify what chemical product is being ordered.");
      return;
    }
    const qtyNum = Number(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError("Please specify a valid quantity in gallons.");
      return;
    }
    const amountNum = Number(totalAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please specify a valid total amount in BDT.");
      return;
    }

    setSaving(true);

    const grandTotal = amountNum;
    const items = [
      {
        product_name: productName,
        quantity: qtyNum,
        unit: "Gallon",
        rate: qtyNum > 0 ? parseFloat((amountNum / qtyNum).toFixed(2)) : 0,
        total: amountNum
      }
    ];

    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          order_number: orderNumber,
          customer_name: customerName,
          order_date: orderDate,
          status,
          total_amount: grandTotal,
          notes,
          items: items.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            total: item.total
          }))
        })
      });
      if (!res.ok) throw new Error('Failed to update order');
      
      setSuccess(true);
      setTimeout(() => router.push("/orders"), 800);
    } catch (err: any) {
      setError(err.message || "Failed to update order.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-semibold">Loading purchase details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back link */}
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-teal-650 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Purchase Register
        </Link>
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
            status === "Completed"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
              : status === "Pending"
              ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400"
          }`}
        >
          {status === "Completed" ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : status === "Pending" ? (
            <Clock className="w-3.5 h-3.5" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          {status}
        </span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50">
          Manage Order: <span className="text-teal-600 dark:text-teal-400 font-mono">{orderNumber}</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review details, modify chemical item quantities, and log status updates.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-medium">
          Order database records updated successfully! Redirecting...
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
              <ShoppingBag className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>Purchase Order details</span>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {/* Customer Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Name / Company *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 font-semibold"
                  required
                />
              </div>

              {/* Chemical Product */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">What Material (Chemical Product) *</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 font-semibold"
                  required
                />
              </div>

              {/* Quantity & Total BDT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">How Many Gallons *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 pl-3 pr-16 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 font-semibold"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-450 dark:text-slate-500">Gallons</span>
                  </div>
                </div>

                {/* Total BDT */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">How Much Money (Total BDT) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="0.00"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 pl-12 pr-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 font-semibold"
                      required
                    />
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-450 dark:text-slate-500">BDT</span>
                  </div>
                </div>
              </div>

              {/* Order Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Order Date *</label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 font-semibold cursor-pointer"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Order Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 font-semibold cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Special Instructions / Shipping Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Grand total bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-teal-50/40 dark:bg-teal-950/15 rounded-xl border border-teal-150/40 dark:border-teal-900/30 gap-2.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-450 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-teal-650 dark:text-teal-400" />
                <span>Recompute rates when updating concentration parameters.</span>
              </span>
              <div className="text-right font-extrabold text-slate-800 dark:text-slate-50">
                <span className="text-xs text-slate-450 font-bold uppercase tracking-wider mr-2">Grand Total:</span>
                <span className="text-lg text-teal-655 dark:text-teal-405">
                  BDT {Number(totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center gap-3">
            <div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-455 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Order
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <Link
                href="/orders"
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-655 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving Changes..." : "Save Order Changes"}
              </button>
            </div>
          </div>
        </form>

        {/* Sidebar panels (Associated Documents) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
              Order Documents
            </h3>
            {associatedDocs.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-2">
                No chemical analysis reports or purchase orders associated. Attach files in the Vault.
              </p>
            ) : (
              <div className="space-y-2.5">
                {associatedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-150 dark:border-slate-800/40 text-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4.5 h-4.5 text-teal-650 dark:text-teal-400 shrink-0" />
                      <span className="font-medium truncate text-slate-700 dark:text-slate-300">
                        {doc.name}
                      </span>
                    </div>
                    <a
                      href={doc.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-teal-650 hover:underline shrink-0 ml-2"
                    >
                      View File
                    </a>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-2">
              <Link
                href="/documents"
                className="w-full text-center block bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-655 dark:text-slate-250 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Go to Document Vault
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
