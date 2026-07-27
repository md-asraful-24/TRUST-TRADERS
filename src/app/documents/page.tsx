"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
  Upload,
  FileText,
  Search,
  Filter,
  Plus,
  Trash2,
  ExternalLink,
  Paperclip,
  CheckCircle,
  FileCode,
  Image as ImageIcon
} from "lucide-react";
import { mockDb, isMockMode, supabase } from "@/lib/supabase";
import { useAdminStatus } from "@/lib/authUtils";

const compressImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL(file.type, quality);
          resolve(compressed);
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const groupDocs = (docsList: any[]) => {
  const grouped: Record<string, any[]> = {};
  
  // Sort documents by date descending
  const sortedDocs = [...docsList].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  sortedDocs.forEach((doc) => {
    let folderName = "";
    let cleanName = doc.name || "";
    const match = (doc.name || "").match(/^(?:\[\[(.*?)\]\]\s*)?(?:\[#([^\]]+)\]\s*)?(.*)$/);
    
    const dateObj = new Date(doc.created_at || new Date().toISOString());
    
    doc.formattedTime = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    doc.formattedDate = dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    
    let parsedCompany = null;
    if (match) {
      parsedCompany = match[1] ? match[1].trim() : null;
      doc.documentNumber = match[2] ? match[2].trim() : null;
      cleanName = match[3] ? match[3].trim() : (doc.name || "");
    } else {
      doc.documentNumber = null;
    }
    
    folderName = parsedCompany;
    if (!folderName) {
      if (doc.associated_type && doc.associated_type !== "general" && doc.associated_type !== "order") {
        folderName = doc.associated_type;
      } else {
        folderName = "General Archive";
      }
    }
    doc.cleanName = cleanName || doc.name;
    
    if (!grouped[folderName]) {
      grouped[folderName] = [];
    }
    grouped[folderName].push(doc);
  });
  
  return grouped;
};

export default function DocumentVaultPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const { isAdmin, isSuperAdmin } = useAdminStatus();

  // Accordion folder states
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [folderDateFilters, setFolderDateFilters] = useState<Record<string, string>>({});

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Upload Form State
  const [docName, setDocName] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Preview Modal State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [previewType, setPreviewType] = useState("");

  const handlePreview = async (doc: any) => {
    setPreviewUrl(null);
    setPreviewName(doc.name);
    setPreviewType(doc.file_type || (doc.name.endsWith(".pdf") ? "application/pdf" : "image/png"));

    if (doc.file_path) {
        setPreviewUrl(doc.file_path);
        return;
    }

    try {
        if (isMockMode) {
            // In mock mode, fetch from API
            const resDocs = await fetch('/api/documents');
            const docsList = await resDocs.json();
            const fullDoc = docsList.find((d: any) => d.id === doc.id) || mockDb.getDocuments().find((d: any) => d.id === doc.id);
            if (fullDoc && fullDoc.file_path) {
                setPreviewUrl(fullDoc.file_path);
                setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, file_path: fullDoc.file_path } : d));
            }
        } else {
            // In real supabase mode, fetch the specific file_path using API
            const res = await fetch(`/api/documents?id=${doc.id}&include_file=true`);
            const data = await res.json();
            if (res.ok && data && data.file_path) {
                setPreviewUrl(data.file_path);
                setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, file_path: data.file_path } : d));
            }
        }
    } catch (err) {
        console.error("Failed to load preview url:", err);
    }
  };

  useEffect(() => {
    async function loadVaultData() {
      try {
        let docsList: any[] = [];
        let ordersList: any[] = [];

        try {
          const resSettings = await fetch('/api/settings');
          const dataSettings = await resSettings.json();
          if (dataSettings.companies && dataSettings.companies.length > 0) {
            setCompanies(dataSettings.companies);
          } else {
            setCompanies(mockDb.getCompanies());
          }
        } catch (e) {
          setCompanies(mockDb.getCompanies());
        }

        const resDocs = await fetch('/api/documents');
        if (!resDocs.ok) throw new Error("Failed to fetch docs");
        docsList = await resDocs.json();
        
        const resOrders = await fetch('/api/orders');
        if (resOrders.ok) {
           ordersList = await resOrders.json();
        }

        setDocuments(docsList);
        setFilteredDocs(docsList);
        setOrders(ordersList);
      } catch (err) {
        console.error("Error loading vault:", err);
      } finally {
        setLoading(false);
      }
    }
    loadVaultData();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = [...documents];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((d: any) => 
        d.name.toLowerCase().includes(q) || 
        (d.associated_type && d.associated_type.toLowerCase().includes(q))
      );
    }

    if (companyFilter !== "All") {
      result = result.filter((d: any) => {
        const match = d.name.match(/^(?:\[\[(.*?)\]\]\s*)?/);
        let comp = match && match[1] ? match[1].trim() : null;
        if (!comp && d.associated_type && d.associated_type !== "general" && d.associated_type !== "order") {
            comp = d.associated_type;
        }
        return (comp || "General Archive") === companyFilter;
      });
    }

    setFilteredDocs(result);
  }, [searchQuery, companyFilter, documents]);

  // Auto-expand most recent folder when data is loaded
  useEffect(() => {
    if (filteredDocs.length > 0) {
      const grouped = groupDocs(filteredDocs);
      const folders = Object.keys(grouped);
      
      setExpandedFolders((prev: Record<string, boolean>) => {
        const hasExpanded = Object.values(prev).some(v => v);
        if (hasExpanded) return prev;
        
        const nextState = { ...prev };
        if (folders.length > 0) {
          nextState[folders[0]] = true;
        }
        return nextState;
      });
    }
  }, [filteredDocs]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto fill doc name if empty
      if (!docName) {
        setDocName(file.name);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedFile && isMockMode === false) {
      setError("Please select a file to upload.");
      return;
    }
    if (!docName.trim()) {
      setError("Please provide a document title.");
      return;
    }

    setUploading(true);

    try {
      let fileUrl = "";
      const fileSize = selectedFile ? selectedFile.size : 45290; // Default simulated size
      const fileType = selectedFile ? selectedFile.type : "application/pdf";

      if (isMockMode) {
        if (selectedFile) {
          try {
            fileUrl = await compressImage(selectedFile);
          } catch (e) {
            console.error("Failed to read and compress file, falling back to placeholder:", e);
            fileUrl = fileType.includes("image")
              ? "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop"
              : "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
          }
        } else {
          fileUrl = fileType.includes("image")
            ? "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop"
            : "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        }

        const finalDocName = `${selectedCompany ? `[[${selectedCompany}]] ` : ""}${docNumber.trim() ? `[#${docNumber.trim()}] ` : ""}${docName}`;

        const newDoc = {
          id: Math.random().toString(36).substring(2, 9),
          name: finalDocName,
          file_path: fileUrl,
          file_type: fileType,
          file_size: fileSize,
          associated_type: "general", // Fixed to satisfy DB check constraint
          associated_id: null,
          created_at: new Date().toISOString()
        };

        const res = await fetch('/api/documents');
        let currentDocs = await res.json();
        if (!currentDocs || currentDocs.length === 0) currentDocs = mockDb.getDocuments();
        const updated = [newDoc, ...currentDocs];
        await fetch('/api/documents', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        setDocuments(updated);
        setSuccess(true);
      } else {
        // Real Supabase storage bucket upload
        const fileExt = selectedFile!.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `vault/${fileName}`;

        // 1. Upload to Supabase Storage Bucket
        const { error: storageError } = await supabase.storage
          .from("chemical-factory-vault")
          .upload(filePath, selectedFile!);

        if (storageError) {
          console.warn("Storage upload failed (bucket might be missing). Falling back to base64 data URL.", storageError);
          // Fallback to base64
          fileUrl = await compressImage(selectedFile!);
        } else {
          // 2. Get Public Link URL
          const { data: publicUrlData } = supabase.storage
            .from("chemical-factory-vault")
            .getPublicUrl(filePath);

          fileUrl = publicUrlData.publicUrl;
        }

        const finalDocName = `${selectedCompany ? `[[${selectedCompany}]] ` : ""}${docNumber.trim() ? `[#${docNumber.trim()}] ` : ""}${docName}`;

        // 3. Insert Row into Database via API
        const docRes = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: finalDocName,
            file_path: fileUrl,
            file_type: fileType,
            file_size: fileSize,
            associated_type: "general", // Fixed to satisfy DB check constraint
            associated_id: null
          })
        });

        const docDataResp = await docRes.json();
        if (!docRes.ok) throw new Error(docDataResp.error || "Failed to save document");

        setDocuments([docDataResp.document, ...documents]);
        setSuccess(true);
      }

      // Reset Form
      setDocName("");
      setDocNumber("");
      setSelectedCompany("");
      setSelectedFile(null);
      const fileInput = document.getElementById("file-upload-input") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      setError(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this document from the vault?")) return;

    try {
      if (isMockMode) {
        const res = await fetch('/api/documents');
        let docs = await res.json();
        if (!docs || docs.length === 0) docs = mockDb.getDocuments();
        const updated = docs.filter((d: any) => d.id !== docId);
        await fetch('/api/documents', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        });
        setDocuments(updated);
      } else {
        // Delete from Storage
        if (filePath.includes("chemical-factory-vault")) {
          const pathSegments = filePath.split("chemical-factory-vault/");
          if (pathSegments.length > 1) {
            const relativePath = pathSegments[1];
            await supabase.storage.from("chemical-factory-vault").remove([relativePath]);
          }
        }

        // Delete from Database via API
        const delRes = await fetch(`/api/documents?id=${docId}`, { method: 'DELETE' });
        if (!delRes.ok) {
           const err = await delRes.json();
           throw new Error(err.error || "Failed to delete document");
        }
        setDocuments(documents.filter((d) => d.id !== docId));
      }
    } catch (err) {
      console.error("Failed to delete document:", err);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getAssocName = (type: string, id: string) => {
    if (!id) return "General Archive";
    if (type === "order") {
      const order = orders.find((o: any) => o.id === id);
      return order ? `Order ${order.order_number}` : "Order Ref";
    }
    return "General Archive";
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 font-semibold">Opening chemical safety vault...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50">Document Vault</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Upload and archive MSDS reports, chemical analyses, customer POs, and certifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Form */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm self-start space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <Upload className="w-4.5 h-4.5 text-teal-650" />
            <span>Upload New Document</span>
          </h2>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              Document archived successfully!
            </div>
          )}

          <form onSubmit={handleUpload} className="space-y-4">
            
            {/* File Picker */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select File *</label>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 rounded-xl p-4.5 text-center cursor-pointer transition-colors relative group">
                <input
                  type="file"
                  id="file-upload-input"
                  onChange={handleFileSelect}
                  accept=".pdf,image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Paperclip className="w-8 h-8 text-slate-400 group-hover:text-teal-500 mx-auto mb-2 transition-colors" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {selectedFile ? selectedFile.name : "Drag files here or Browse"}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Supports PDF, PNG, JPG up to 10MB</p>
              </div>
            </div>

            {/* Document Number */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Document ID / Number (For Searching)</label>
              <input
                type="text"
                placeholder="e.g. PO-8921 or Batch-44"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Document Title */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Document Name *</label>
              <input
                type="text"
                placeholder="e.g. MSDS Nitric Acid Grade 2"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100"
                required
              />
            </div>

            {/* Company Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Company Name</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 cursor-pointer font-semibold"
              >
                <option value="">-- Select Company (Optional) --</option>
                {companies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-teal-500/10"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Archiving..." : "Archive File"}
            </button>
          </form>
        </div>

        {/* Archives List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            
            {/* Search and Date */}
            <div className="flex w-full sm:w-auto items-center gap-3 flex-1">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 z-10" />
                <input
                  type="text"
                  placeholder="Search files or companies..."
                  value={searchQuery}
                  onFocus={() => setShowAutocomplete(true)}
                  onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 pl-9 pr-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 relative z-20"
                />
                
                {/* Custom Autocomplete Dropdown */}
                {showAutocomplete && companies.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                    {companies
                      .filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(c => (
                        <div
                          key={c}
                          onClick={() => {
                            setSearchQuery(c);
                            setShowAutocomplete(false);
                          }}
                          className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                        >
                          {c}
                        </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Company Filter */}
            <div className="w-full sm:w-auto">
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full sm:w-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-xl py-2 pl-3 pr-8 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 cursor-pointer font-bold appearance-none"
              >
                <option value="All">All Companies</option>
                {companies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Folder Hierarchy Explorer */}
          <div className="space-y-4">
            {filteredDocs.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 py-16 text-center rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-500">No documents found.</p>
                <p className="text-xs text-slate-400 mt-1">Upload a PDF CoA sheet or an order PO image to list here.</p>
              </div>
            ) : (
              (() => {
                const grouped = groupDocs(filteredDocs);
                return Object.entries(grouped).map(([companyName, docs]) => {
                  const isExpanded = !!expandedFolders[companyName];
                  const totalDocs = docs.length;

                  return (
                    <div
                      key={companyName}
                      className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                      {/* Company Header */}
                      <div className="w-full flex flex-wrap sm:flex-nowrap items-center justify-between p-4.5 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors border-none outline-none gap-3 sm:gap-0">
                        <div 
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-[50%]"
                          onClick={() => setExpandedFolders((prev) => ({ ...prev, [companyName]: !isExpanded }))}
                        >
                          {isExpanded ? (
                            <FolderOpen className="w-6 h-6 text-amber-500 dark:text-amber-400 shrink-0" />
                          ) : (
                            <Folder className="w-6 h-6 text-amber-500 dark:text-amber-400 shrink-0" />
                          )}
                          <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm cursor-pointer">
                              {companyName}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {totalDocs} {totalDocs === 1 ? "document" : "documents"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-slate-400 ml-auto">
                          <input
                            type="text"
                            placeholder="DD/MM/YYYY"
                            value={folderDateFilters[companyName] || ""}
                            onChange={(e) => {
                              let val = e.target.value;
                              // Allow backspace to work naturally, handle only formatting
                              if (e.nativeEvent && (e.nativeEvent as InputEvent).inputType === "deleteContentBackward") {
                                setFolderDateFilters(prev => ({ ...prev, [companyName]: val }));
                                return;
                              }
                              val = val.replace(/\D/g, "");
                              if (val.length > 8) val = val.slice(0, 8);
                              if (val.length >= 5) {
                                val = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`;
                              } else if (val.length >= 3) {
                                val = `${val.slice(0, 2)}/${val.slice(2)}`;
                              }
                              setFolderDateFilters(prev => ({ ...prev, [companyName]: val }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-teal-500 rounded-lg py-1 px-3 text-xs outline-none transition-colors text-slate-800 dark:text-slate-100 shadow-sm w-32 font-medium"
                            title="Search by DD/MM/YYYY format"
                          />
                          <div 
                            className="cursor-pointer p-1"
                            onClick={() => setExpandedFolders((prev) => ({ ...prev, [companyName]: !isExpanded }))}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Folder Content - Files Grid directly inside */}
                      {isExpanded && (
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/20 dark:bg-slate-900/10">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {docs.filter(doc => {
                               const filterText = (folderDateFilters[companyName] || "").toLowerCase().trim();
                               if (!filterText) return true;
                               const docDateObj = new Date(doc.created_at || new Date().toISOString());
                               
                               const d = docDateObj.getDate().toString().padStart(2, '0');
                               const m = (docDateObj.getMonth() + 1).toString().padStart(2, '0');
                               const y = docDateObj.getFullYear();
                               const ddMMyyyy = `${d}/${m}/${y}`;
                               const ddDashMmDashYyyy = `${d}-${m}-${y}`;
                               
                               const formattedLong = docDateObj.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }).toLowerCase();
                               const formattedShort = docDateObj.toLocaleDateString("en-US").toLowerCase();
                               
                               return formattedLong.includes(filterText) || 
                                      formattedShort.includes(filterText) || 
                                      ddMMyyyy.includes(filterText) || 
                                      ddDashMmDashYyyy.includes(filterText);
                            }).map((doc) => {
                              const isPdf =
                                doc.file_type?.includes("pdf") ||
                                doc.name.endsWith(".pdf");
                              return (
                                <div
                                  key={doc.id}
                                  className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-teal-500/50 transition-all duration-200 group"
                                >
                                            <div>
                                              {/* Document Number Badge */}
                                              {doc.documentNumber && (
                                                <div className="mb-3 border-b border-slate-100 dark:border-slate-700/50 pb-2 flex items-center">
                                                  <span className="text-[11px] font-bold tracking-wide text-teal-700 dark:text-teal-300 bg-teal-50/80 dark:bg-teal-900/40 px-2.5 py-1 rounded-md border border-teal-200/60 dark:border-teal-700/50 shadow-sm">
                                                    #{doc.documentNumber}
                                                  </span>
                                                </div>
                                              )}

                                              {/* Document Type Badge & Delete */}
                                              <div className="flex justify-between items-start mb-2.5">
                                                <div className="w-10 h-10 shrink-0 bg-slate-50 dark:bg-slate-900/80 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700/60 flex items-center justify-center overflow-hidden relative">
                                                  {isPdf ? (
                                                    <FileText className="w-5 h-5 text-red-500" />
                                                  ) : (
                                                    <>
                                                      <ImageIcon className="w-5 h-5 text-indigo-500 absolute z-0" />
                                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                                      <img
                                                        src={doc.file_path}
                                                        alt="doc preview"
                                                        className="w-full h-full object-cover rounded-md relative z-10"
                                                        onError={(e) => {
                                                          (e.target as HTMLElement).style.display =
                                                            "none";
                                                        }}
                                                      />
                                                    </>
                                                  )}
                                                </div>

                                                {isSuperAdmin && (
                                                  <button
                                                    onClick={() => handleDelete(doc.id, doc.file_path)}
                                                    className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                                    title="Delete file"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                              </div>

                                              {/* Info */}
                                              <h3
                                                className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate"
                                                title={doc.cleanName}
                                              >
                                                {doc.cleanName}
                                              </h3>
                                              <p className="text-[9px] text-slate-400 mt-0.5 flex justify-between items-center pr-2">
                                                <span>Size: {formatBytes(doc.file_size)}</span>
                                                <span className="text-teal-600 dark:text-teal-400 font-bold tracking-tight">{doc.formattedDate} • {doc.formattedTime}</span>
                                              </p>
                                            </div>

                                            {/* Footer Action Links */}
                                            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between">
                                              <span className="text-[9px] font-bold text-teal-650 bg-teal-50 dark:bg-teal-950/20 px-1.5 py-0.5 rounded border border-teal-150/40">
                                                {(() => {
                                                  const match = doc.name.match(/^(?:\[\[(.*?)\]\]\s*)?/);
                                                  let comp = match && match[1] ? match[1].trim() : null;
                                                  if (!comp && doc.associated_type && doc.associated_type !== "general" && doc.associated_type !== "order") {
                                                    comp = doc.associated_type;
                                                  }
                                                  return comp || "General Archive";
                                                })()}
                                              </span>

                                              <button
                                                onClick={() => handlePreview(doc)}
                                                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-350 hover:text-teal-655 dark:hover:text-teal-400 transition-colors cursor-pointer border-none bg-transparent"
                                              >
                                                <span>Preview</span>
                                                <ExternalLink className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()
            )}
          </div>
        </div>

      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 truncate max-w-[80%]">
                {previewName}
              </h3>
              <button
                onClick={() => {
                  setPreviewUrl(null);
                  setPreviewName("");
                  setPreviewType("");
                }}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-750/50 transition-colors cursor-pointer text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex items-center justify-center min-h-[45vh] max-h-[70vh] overflow-auto bg-slate-950 rounded-xl p-2">
              {previewType.includes("pdf") ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-[60vh] border-0 rounded-lg bg-white"
                  title="PDF Document Preview"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewUrl}
                  alt={previewName}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              )}
            </div>
            
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
              <a
                href={previewUrl}
                download={previewName}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/10 cursor-pointer animate-pulse"
              >
                Download File
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
