"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, ShoppingBag, Info } from "lucide-react";
import { mockDb, isMockMode, supabase } from "@/lib/supabase";

export default function NewOrderPage() {
  const router = useRouter();
  
  // Basic Info States
  const [customerName, setCustomerName] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [status, setStatus] = useState("Pending");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simplified Item States
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<string>("");

  // Generate Auto-Order Number and Today's Date
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setOrderDate(formattedDate);

    const dateSerial = formattedDate.replace(/-/g, "");
    const randomSerial = Math.floor(100 + Math.random() * 900); // 3-digit random number
    setOrderNumber(`ORD-${dateSerial}-${randomSerial}`);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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

    setLoading(true);

    // Structure single item for database compatibility
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
      if (isMockMode) {
        const res = await fetch('/api/orders');
        let currentOrders = await res.json();
        if (!currentOrders || currentOrders.length === 0) currentOrders = mockDb.getOrders();
        const newOrderId = Math.random().toString(36).substring(2, 9);
        const orderItemsWithIds = items.map((item, idx) => ({
          id: `oi-${newOrderId}-${idx}`,
          ...item
        }));

        const newOrder = {
          id: newOrderId,
          order_number: orderNumber,
          customer_name: customerName,
          order_date: orderDate,
          status,
          total_amount: grandTotal,
          notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const updated = [newOrder, ...currentOrders];
        await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } else {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
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
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to create order');
        }
      }
      router.push("/orders");
    } catch (err: any) {
      setError(err.message || "Failed to submit new purchase order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back to list */}
      <div className="flex items-center gap-2">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-teal-650 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Purchase Register
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50">Create Purchase Order</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Draft a new chemical order contract for dispatching and billing tracking.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            <ShoppingBag className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>Order Reference Information</span>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {/* Customer Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Name / Company *</label>
              <input
                type="text"
                placeholder="e.g. Pioneer Paint Ltd"
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
                placeholder="e.g. Sulfuric Acid 98%"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 font-semibold"
                required
              />
            </div>

            {/* Quantity and Total Amount */}
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

              {/* Total Amount */}
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

            {/* Dates and Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Initial Status</label>
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

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Generated Order #</label>
                <input
                  type="text"
                  value={orderNumber}
                  disabled
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 px-3 text-xs text-slate-500 dark:text-slate-500 font-bold outline-none"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Special Instructions / Shipping Notes</label>
              <textarea
                rows={3}
                placeholder="Add delivery location, drivers directions, concentration parameters, or custom billing codes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Grand total bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-teal-50/40 dark:bg-teal-950/15 rounded-xl border border-teal-150/40 dark:border-teal-900/30 gap-2.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-450 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-teal-650 dark:text-teal-400" />
              <span>Ensure rates match factory price sheet policy guidelines.</span>
            </span>
            <div className="text-right font-extrabold text-slate-800 dark:text-slate-50">
              <span className="text-xs text-slate-450 font-bold uppercase tracking-wider mr-2">Grand Order Total:</span>
              <span className="text-lg text-teal-655 dark:text-teal-405">
                BDT {Number(totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            href="/orders"
            className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-655 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving Order..." : "Save Purchase Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
