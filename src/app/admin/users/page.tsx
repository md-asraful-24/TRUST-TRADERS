"use client";

import React, { useEffect, useState } from "react";
import { Users, Shield, ShieldAlert, CheckCircle, Clock, Search, MoreVertical, Edit2 } from "lucide-react";
import Link from "next/link";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { isMockMode } from "@/lib/supabase";
import { useAdminStatus } from "@/lib/authUtils";
import { Trash2 } from "lucide-react";

export default function UserManagement() {
  const router = useRouter();
  const { isSuperAdmin } = useAdminStatus();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    // Basic Client-Side check to ensure they are Admin
    const role = Cookies.get('cf_auth_role');
    if (role !== 'Admin') {
      router.push('/');
      return;
    }

    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      // Call the API which now handles local JSON fallback


      const res = await fetch(`/api/users?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (user: any) => {
    if (user.email === 'asrafulislamai1983@gmail.com') {
      alert("Cannot hold the Super Admin.");
      return;
    }
    setUpdating(user.id);
    const newStatus = user.status === 'Hold' ? 'Active' : 'Hold';
    
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, role: user.role, status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert("Error updating user status.");
    } finally {
      setUpdating(null);
    }
  };

  const toggleRole = async (user: any) => {
    if (user.email === 'asrafulislamai1983@gmail.com') {
      alert("Cannot demote the Super Admin.");
      return;
    }
    
    setUpdating(user.id);
    const newRole = user.role === 'Admin' ? 'User' : 'Admin';
    const newStatus = newRole === 'Admin' ? 'Active' : user.status;
    
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, role: newRole, status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update role");
      
      // Update local storage so they can bypass OTP next time
      const saved = localStorage.getItem("cf_extra_admins");
      let extraAdmins: string[] = saved ? JSON.parse(saved) : [];
      const emailLower = user.email.toLowerCase().trim();

      if (newRole === 'Admin') {
        if (!extraAdmins.includes(emailLower)) {
          extraAdmins.push(emailLower);
        }
      } else {
        extraAdmins = extraAdmins.filter(e => e !== emailLower);
      }
      localStorage.setItem("cf_extra_admins", JSON.stringify(extraAdmins));

      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole, status: newStatus } : u));
    } catch (err) {
      alert("Error updating user role.");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (user: any) => {
    if (user.email === 'asrafulislamai1983@gmail.com') {
      alert("Cannot delete the Super Admin.");
      return;
    }
    if (!confirm(`Are you sure you want to completely delete the user ${user.email}? They will lose all access immediately.`)) {
      return;
    }
    setUpdating(user.id);
    try {
      const res = await fetch(`/api/users?id=${user.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete user");
      }
      setUsers(users.filter(u => u.id !== user.id));
    } catch (err: any) {
      alert(err.message || "Error deleting user.");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500 font-semibold">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-50 flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-500" />
            User Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Approve new accounts and assign roles.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 p-4 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/60">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Address</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-700 dark:text-slate-200">{user.email}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Joined {new Date(user.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      user.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                    }`}>
                      {user.status === 'Active' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      user.role === 'Admin'
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {user.role === 'Admin' ? <ShieldAlert className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => toggleStatus(user)}
                        disabled={updating === user.id || user.email === 'asrafulislamai1983@gmail.com'}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                      >
                        {user.status === 'Hold' ? 'Activate' : 'Hold'}
                      </button>
                      <button 
                        onClick={() => toggleRole(user)}
                        disabled={updating === user.id || user.email === 'asrafulislamai1983@gmail.com'}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors disabled:opacity-50"
                      >
                        Make {user.role === 'Admin' ? 'User' : 'Admin'}
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={updating === user.id || user.email === 'asrafulislamai1983@gmail.com'}
                          className="text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
