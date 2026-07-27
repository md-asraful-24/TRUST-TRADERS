"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, Trash2, Info, FileText } from "lucide-react";
import { mockDb, isMockMode, supabase } from "@/lib/supabase";

interface ChalanItemInput {
  product_name: string;
  unit: string;
  quantity: number;
}

export default function NewChalanPage() {
  const router = useRouter();

  // Basic Info States
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [chalanDate, setChalanDate] = useState("");
  const [chalanNumber, setChalanNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Goods List (Start with 1 empty goods row)
  const [items, setItems] = useState<ChalanItemInput[]>([
    { product_name: "", unit: "kg", quantity: 0 }
  ]);

  // Generate Auto-Chalan SL No and Today's Date
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setChalanDate(formattedDate);

    // Auto SL No generation
    const currentChalans = isMockMode ? mockDb.getChalans() : [];
    const nextSerial = String(currentChalans.length + 1).padStart(3, "0");
    setChalanNumber(nextSerial);
  }, []);

  const handleItemChange = (index: number, field: keyof ChalanItemInput, value: any) => {
    const updated = [...items];
    if (field === "quantity") {
      updated[index] = {
        ...updated[index],
        [field]: Number(value) || 0
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value
      };
    }
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([...items, { product_name: "", unit: "kg", quantity: 0 }]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) return;
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    if (!customerName.trim()) {
      setError("Please specify a Customer/Company name.");
      return;
    }
    if (!chalanNumber.trim()) {
      setError("Please specify an SL No.");
      return;
    }
    if (!deliveryAddress.trim()) {
      setError("Please specify a Delivery Address.");
      return;
    }

    const invalidItems = items.some(
      (item) => !item.product_name.trim() || item.quantity <= 0
    );
    if (invalidItems) {
      setError("Please ensure all goods descriptions are filled and quantities are greater than zero.");
      return;
    }

    setLoading(true);

    const newChalan = {
      id: Math.random().toString(36).substring(2, 9),
      chalan_number: chalanNumber,
      customer_name: customerName,
      chalan_date: chalanDate,
      delivery_address: deliveryAddress,
      contact_person: contactPerson,
      phone,
      items,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      if (isMockMode) {
        const res = await fetch('/api/chalans');
        let currentChalans = await res.json();
        if (!currentChalans || currentChalans.length === 0) currentChalans = mockDb.getChalans();
        const updated = [newChalan, ...currentChalans];
        await fetch('/api/chalans', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
      } else {
        // Use API POST instead of supabase.from directly
        const res = await fetch('/api/chalans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chalan_number: chalanNumber,
            customer_name: customerName,
            chalan_date: chalanDate,
            delivery_address: deliveryAddress,
            contact_person: contactPerson,
            phone,
            items: items
          })
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to insert chalan');
        }
      }
      router.push("/chalans");
    } catch (err: any) {
      setError(err.message || "Failed to submit new delivery chalan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <div className="flex items-center gap-2">
        <Link
          href="/chalans"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-teal-655 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Delivery Register
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50">Create Delivery Chalan</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Draft a new chalan record containing dispatch address, customer info, and goods listing.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Form Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Logistics Details */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
            <FileText className="w-5 h-5 text-teal-600 dark:text-teal-405" />
            <span>Customer & Logistics Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5">
            {/* Customer Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer / Company Name *</label>
              <input
                type="text"
                placeholder="e.g. Pioneer Paint Ltd"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 font-semibold"
                required
              />
            </div>

            {/* Delivery Address */}
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delivery Address *</label>
              <input
                type="text"
                placeholder="e.g. Ganda, Savar, Dhaka"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 font-semibold"
                required
              />
            </div>

            {/* Contact Person */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Md. Rahim"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. 01711223344"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 font-semibold"
              />
            </div>

            {/* SL No */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chalan SL No *</label>
              <input
                type="text"
                placeholder="e.g. 003"
                value={chalanNumber}
                onChange={(e) => setChalanNumber(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 font-bold"
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date *</label>
              <input
                type="date"
                value={chalanDate}
                onChange={(e) => setChalanDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2.5 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 font-semibold cursor-pointer"
                required
              />
            </div>
          </div>
        </div>

        {/* Dynamic Goods List Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700/60 pb-3">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span>Goods List / Material Dispatch</span>
            </h3>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-900/50 text-teal-650 dark:text-teal-400 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Goods
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-150 dark:border-slate-800/40 relative group"
              >
                {/* Product Name */}
                <div className="sm:col-span-6 space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block sm:hidden">Description of Goods *</label>
                  <input
                    type="text"
                    placeholder="Description of Goods"
                    value={item.product_name}
                    onChange={(e) => handleItemChange(idx, "product_name", e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-lg py-2 px-2.5 text-xs outline-none text-slate-800 dark:text-slate-100 font-medium"
                    required
                  />
                </div>

                {/* Unit */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block sm:hidden">Unit</label>
                  <select
                    value={item.unit}
                    onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-lg py-2 px-2.5 text-xs outline-none text-slate-800 dark:text-slate-100 cursor-pointer font-medium"
                  >
                    <option value="kg">kg</option>
                    <option value="Liter">Liter</option>
                    <option value="Drum">Drum</option>
                    <option value="Bag">Bag</option>
                    <option value="Ton">Ton</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block sm:hidden">Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={item.quantity || ""}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-lg py-2 px-2.5 text-xs outline-none text-slate-800 dark:text-slate-100 font-semibold"
                    required
                  />
                </div>

                {/* Delete row */}
                <div className="sm:col-span-1 flex items-center justify-end">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg transition-colors cursor-pointer"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-455">
            <Info className="w-4 h-4 text-teal-650 dark:text-teal-400" />
            <span>A maximum of 8 rows of goods can be printed cleanly on the delivery slip.</span>
          </div>
        </div>

        {/* Submit controls */}
        <div className="flex justify-end gap-3">
          <Link
            href="/chalans"
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
            {loading ? "Generating Chalan..." : "Save Delivery Chalan"}
          </button>
        </div>
      </form>
    </div>
  );
}
