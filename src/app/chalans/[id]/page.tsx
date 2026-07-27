"use client";
import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Trash2, Image as ImageIcon, LayoutTemplate } from "lucide-react";
import { mockDb, isMockMode, supabase } from "@/lib/supabase";
import { useAdminStatus } from "@/lib/authUtils";

export default function ChalanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: chalanId } = use(params);

  const [chalan, setChalan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin } = useAdminStatus();
  const [useImageTemplate, setUseImageTemplate] = useState(false);

  useEffect(() => {
    async function loadChalan() {
      try {
        let data: any = null;
        const res = await fetch(`/api/chalans`);
        const allChalans = await res.json();
        const chalanData = allChalans.find((c: any) => c.id === chalanId);
        
        if (chalanData) {
          setChalan(chalanData);
        } else {
          setError("Chalan not found.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load chalan.");
      } finally {
        setLoading(false);
      }
    }
    loadChalan();
  }, [chalanId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this chalan?")) return;

    try {
      if (isMockMode) {
        const res = await fetch('/api/chalans');
        const currentChalans = await res.json();
        const updatedChalans = currentChalans.filter((c: any) => c.id !== chalanId);
        await fetch('/api/chalans', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedChalans)
        });
      } else {
        const res = await fetch(`/api/chalans?id=${chalanId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
      }
      router.push("/chalans");
    } catch (err) {
      console.error("Error deleting chalan:", err);
      alert("Failed to delete chalan. Ensure you have permission.");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] no-print">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 font-semibold">Opening dispatch details...</p>
      </div>
    );
  }

  if (error || !chalan) {
    return (
      <div className="max-w-md mx-auto py-12 text-center no-print">
        <p className="text-sm font-semibold text-rose-500">{error || "Failed to load chalan."}</p>
        <Link href="/chalans" className="text-xs text-teal-600 hover:underline mt-4 block">
          Back to Delivery Register
        </Link>
      </div>
    );
  }

  // Pre-fill the table up to 8 rows for visual fidelity matching the physical slip
  const items = chalan.chalan_items || chalan.items || [];
  const maxRows = 8;
  const tableRows = [...items];
  while (tableRows.length < maxRows) {
    tableRows.push({ product_name: "", unit: "", quantity: "" });
  }

  // Calculate sum of quantities
  const totalQuantity = items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background-color: white !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}} />

      {/* Action Menu (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 no-print">
        <Link
          href="/chalans"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-teal-650 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Delivery Register
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {/* Template Toggle */}
          <button
            onClick={() => setUseImageTemplate(!useImageTemplate)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer mr-2"
          >
            {useImageTemplate ? <LayoutTemplate className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
            {useImageTemplate ? "Switch to HTML Design" : "Use PNG Background"}
          </button>

          {isAdmin && (
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1 px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Delete Chalan
            </button>
          )}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-teal-600 hover:bg-teal-505 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10 cursor-pointer active:scale-95 animate-pulse"
          >
            <Printer className="w-4 h-4" />
            Print Chalan
          </button>
        </div>
      </div>

      {useImageTemplate && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-4 rounded-xl no-print text-sm text-amber-800 dark:text-amber-400 font-medium">
          <p><strong>Image Background Mode is Active:</strong> To make the printout look 100% exactly like your design, you must save your template image as <code className="bg-white dark:bg-black px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700 select-all">bg.png</code> inside the <code className="bg-white dark:bg-black px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700">public</code> folder of your project. If you haven't saved it there yet, the background will appear white here.</p>
        </div>
      )}

      {/* High-Fidelity Slip Container */}
      <div className="flex items-center justify-center p-0 md:p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200/40 dark:border-slate-800/20 no-print-bg print-container">
        
        {useImageTemplate ? (
          /* EXACT IMAGE BACKGROUND MODE */
          <div
            className="w-[800px] h-[1130px] relative overflow-hidden print-container shadow-xl print:shadow-none bg-white"
            style={{
              backgroundImage: "url('/bg.png')",
              backgroundSize: "100% 100%",
              backgroundRepeat: "no-repeat",
              boxSizing: "border-box",
              fontFamily: "Arial, sans-serif",
            }}
          >
            {/* Dynamic Data Overlays */}
            {/* SL No */}
            <div className="absolute top-[20.5%] left-[80%] text-[15px] font-mono font-bold text-slate-900">
              {chalan.id.substring(0, 8).toUpperCase()}
            </div>
            {/* Date */}
            <div className="absolute top-[24%] left-[80%] text-[15px] font-bold text-slate-900">
              {new Date(chalan.created_at).toLocaleDateString()}
            </div>
            {/* Delivery Address */}
            <div className="absolute top-[28.5%] left-[26%] w-[68%] text-[15px] font-bold text-slate-900 leading-tight">
              {chalan.delivery_address}
            </div>
            {/* Customer/Company Name */}
            <div className="absolute top-[31.5%] left-[32%] w-[62%] text-[15px] font-bold text-slate-900 leading-tight">
              {chalan.customer_name}
            </div>
            {/* Contact person */}
            <div className="absolute top-[34.5%] left-[22%] w-[35%] text-[15px] font-bold text-slate-900">
              {chalan.contact_person || ""}
            </div>
            {/* Phone */}
            <div className="absolute top-[34.5%] left-[67%] w-[25%] text-[15px] font-bold text-slate-900">
              {chalan.phone || ""}
            </div>

            {/* Table Rows (8 rows max) */}
            <div className="absolute top-[42%] left-[3.5%] w-[93.2%] h-[35.6%] flex flex-col">
              {tableRows.map((row, idx) => (
                <div key={idx} className="flex-1 flex items-center w-full">
                  <div className="w-[7.5%] text-center text-[15px] font-normal text-slate-900">{idx + 1}</div>
                  <div className="w-[48.5%] px-3 text-[15px] font-bold text-slate-900">{row.product_name}</div>
                  <div className="w-[11.2%] text-center text-[15px] font-normal text-slate-900">{row.unit}</div>
                  <div className="w-[11.9%] text-center text-[15px] font-bold text-slate-900">{row.quantity ? Number(row.quantity).toLocaleString() : ""}</div>
                  <div className="w-[20.9%] text-center text-[15px] font-bold text-slate-900"></div>
                </div>
              ))}
            </div>

            {/* Total Quantity Row */}
            <div className="absolute top-[77.6%] left-[3.5%] w-[93.2%] h-[4.4%] flex items-center">
              <div className="w-[79.1%]"></div>
              <div className="w-[20.9%] text-center text-[16px] font-bold text-slate-900">
                 {totalQuantity ? totalQuantity.toLocaleString() : ""}
              </div>
            </div>
          </div>
        ) : (
          /* HTML APPROXIMATION MODE (Fallback) */
          <div
            className="w-[800px] h-[1130px] text-slate-950 py-10 px-8 shadow-xl font-sans relative overflow-hidden print-container"
            style={{
              backgroundColor: "#2bc2e8",
              boxSizing: "border-box"
            }}
          >
            {/* Watermark Logo */}
            <div className="absolute top-[52%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 opacity-[0.2] flex flex-col items-center">
               <div className="w-[450px] h-[450px] flex items-center justify-center relative">
                 <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="50" cy="50" rx="35" ry="45" fill="none" stroke="#68CBE6" strokeWidth="6" opacity="0.8" />
                    <ellipse cx="48" cy="50" rx="30" ry="40" fill="none" stroke="#FDE047" strokeWidth="2" opacity="0.6" />
                    <text x="50" y="60" textAnchor="middle" fontSize="38" fontWeight="bold" fontFamily="serif" fill="#F97316" style={{ letterSpacing: "2px" }}>TT</text>
                  </svg>
               </div>
               <span className="text-[26px] font-extrabold text-slate-950 uppercase tracking-wide absolute bottom-12 opacity-80" style={{ fontFamily: "Arial, sans-serif" }}>UNIQUE DAYS & CHEMICAL</span>
            </div>

            {/* Header section: Logo Left, Address Center/Right */}
            <div className="flex justify-between items-start mb-2 relative z-10 px-2">
              {/* Header / Logo Area */}
              <div className="flex flex-col items-center pl-2 pt-2">
                <div className="w-[110px] h-[110px] flex items-center justify-center mb-1 relative">
                  <svg className="w-full h-full drop-shadow-sm" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Outer rings */}
                    <ellipse cx="50" cy="50" rx="40" ry="40" fill="#6EE7F9" opacity="0.4" />
                    <ellipse cx="50" cy="50" rx="35" ry="35" fill="none" stroke="#FDE047" strokeWidth="1" />
                    <ellipse cx="50" cy="50" rx="30" ry="30" fill="none" stroke="#38BDF8" strokeWidth="4" />
                    
                    {/* TT Text */}
                    <text x="50" y="62" textAnchor="middle" fontSize="34" fontWeight="bold" fontFamily="serif" fill="#F97316" style={{ filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.3))" }}>TT</text>
                  </svg>
                </div>
                <span className="text-[11px] font-extrabold text-slate-950 uppercase tracking-tight whitespace-nowrap" style={{ fontFamily: "Arial, sans-serif" }}>UNIQUE DAYS & CHEMICAL</span>
              </div>

              <div className="text-right pr-2 pt-2">
                <h2 className="text-[44px] tracking-wide text-slate-950 mb-1 leading-none" style={{ fontFamily: "'Algerian', 'Stencil', 'Impact', sans-serif" }}>TRUST TRADERS</h2>
                <div className="text-[17px] font-bold space-y-0.5 text-slate-950 pt-1" style={{ fontFamily: "Arial, sans-serif" }}>
                  <p>Contact:01352268607,01933555517</p>
                  <p>Address: Ganda, Saver,Dhaka</p>
                  <p>Email : ww.gmail.com</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center justify-center mb-2 relative z-10 mt-1 px-4">
              <div className="h-[2px] bg-slate-950 flex-1"></div>
              <div className="flex items-center gap-2 text-slate-950 mx-2 text-lg">
                <span className="text-sm">❖</span>
                <span>✿</span>
                <span className="text-sm">❖</span>
              </div>
              <div className="h-[2px] bg-slate-950 flex-1"></div>
            </div>

            {/* Slip Title & Serial/Date Row */}
            <div className="flex justify-between items-end mb-4 relative z-10 px-4 mt-2">
              <div className="w-[180px]"></div>
              <div className="text-center flex-1 pr-12">
                <h3 className="text-[28px] font-bold text-slate-950 leading-none" style={{ fontFamily: "Arial, sans-serif" }}>Delivery Chalan</h3>
              </div>
              <div className="text-right text-[16px] space-y-2 w-[220px]" style={{ fontFamily: "Arial, sans-serif" }}>
                <div className="flex justify-end items-end whitespace-nowrap">
                  <span className="mr-1">SL No</span>
                  <div className="border-b-[2px] border-dotted border-slate-950 flex-1 min-w-[140px] text-center px-2 font-mono text-sm pb-0.5 relative top-[2px]">{chalan.id.substring(0, 8).toUpperCase()}</div>
                </div>
                <div className="flex justify-end items-end whitespace-nowrap">
                  <span className="mr-1">Date</span>
                  <div className="border-b-[2px] border-dotted border-slate-950 flex-1 min-w-[140px] text-center px-2 text-sm pb-0.5 relative top-[2px]">{new Date(chalan.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Customer Details Box */}
            <div className="mb-4 relative z-10 px-4 mt-4">
              <div className="mb-3">
                <span className="text-[22px] text-slate-950 leading-none font-normal border-b-[2px] border-slate-950 pb-1 inline-block" style={{ fontFamily: "Arial, sans-serif" }}>Customer Details</span>
              </div>
              <div className="space-y-4 text-[16px] text-slate-950 mt-4" style={{ fontFamily: "Arial, sans-serif" }}>
                <div className="flex items-end whitespace-nowrap">
                  <span className="mr-2 font-normal">Delivery Address</span>
                  <div className="border-b-[2px] border-dotted border-slate-950 flex-1 px-2 pb-0.5 font-bold">{chalan.delivery_address}</div>
                </div>
                <div className="flex items-end whitespace-nowrap">
                  <span className="mr-2 font-normal">Customer/ Campany Name</span>
                  <div className="border-b-[2px] border-dotted border-slate-950 flex-1 px-2 pb-0.5 font-bold">{chalan.customer_name}</div>
                </div>
                <div className="flex items-end whitespace-nowrap gap-6">
                  <div className="flex items-end flex-[5]">
                    <span className="mr-2 font-normal">Contact person</span>
                    <div className="border-b-[2px] border-dotted border-slate-950 flex-1 px-2 pb-0.5 font-bold">{chalan.contact_person || ""}</div>
                  </div>
                  <div className="flex items-end flex-[4]">
                    <span className="mr-2 font-normal">Phone</span>
                    <div className="border-b-[2px] border-dotted border-slate-950 flex-1 px-2 pb-0.5 font-bold">{chalan.phone || ""}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Table grid */}
            <div className="border-[2px] border-slate-950 mb-8 overflow-hidden relative z-10 bg-transparent mx-4 mt-6">
              <table className="w-full text-left border-collapse bg-transparent" style={{ fontFamily: "Arial, sans-serif" }}>
                <thead>
                  <tr className="bg-[#a1ba9b] text-[15px] font-bold text-slate-950">
                    <th className="border-[2px] border-slate-950 px-2 py-3 text-center w-[60px]">Sl No</th>
                    <th className="border-[2px] border-slate-950 px-4 py-3 text-center">Description of Goods</th>
                    <th className="border-[2px] border-slate-950 px-2 py-3 text-center w-[80px]">Unit</th>
                    <th className="border-[2px] border-slate-950 px-2 py-3 text-center w-[90px] leading-tight">Quanti<br />ty</th>
                    <th className="border-[2px] border-slate-950 px-2 py-3 text-center w-[120px]">Total Quantity</th>
                  </tr>
                </thead>
                <tbody className="text-[14px] bg-transparent">
                  {tableRows.map((row, idx) => (
                    <tr key={idx} className="h-[46px]">
                      <td className="border-[2px] border-slate-950 text-center text-slate-950 font-normal">{idx + 1}</td>
                      <td className="border-[2px] border-slate-950 px-4 text-slate-950 font-bold">{row.product_name}</td>
                      <td className="border-[2px] border-slate-950 text-center text-slate-950 font-normal">{row.unit}</td>
                      <td className="border-[2px] border-slate-950 text-center text-slate-950 font-bold">
                        {row.quantity ? Number(row.quantity).toLocaleString() : ""}
                      </td>
                      <td className="border-[2px] border-slate-950 text-center text-slate-950 font-bold">
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="h-[46px] bg-transparent">
                    <td colSpan={4} className="border-[2px] border-slate-950 text-center text-slate-950 font-bold text-[18px]">
                      Total Quantity
                    </td>
                    <td className="border-[2px] border-slate-950 text-center text-slate-950 font-bold text-[16px]">
                      {totalQuantity ? totalQuantity.toLocaleString() : ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer signature lines */}
            <div className="flex justify-between items-end text-[17px] font-bold text-slate-950 select-none print:static px-6 mt-20 z-10 relative mb-4" style={{ fontFamily: "Arial, sans-serif" }}>
              <div className="text-center">
                Received by
              </div>
              <div className="text-center pl-8">
                Account/Admin
              </div>
              <div className="text-center pr-4">
                Authorized Signature
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
