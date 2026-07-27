import { useState, useEffect } from 'react';
import { supabase, isMockMode } from './supabase';

export function useAdminStatus() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      try {
        // Always get user from localStorage since login page uses fake auth
        const userEmail = localStorage.getItem("cf_auth_user");

        // Super admin email from env only - never hardcoded in source
        const adminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

        let isAuthorized = false;
        let isSuper = false;
        
        // Check cookie role first (this is the most reliable as it comes from API)
        const cookies = document.cookie.split(';').map(c => c.trim());
        const roleCookie = cookies.find(c => c.startsWith('cf_auth_role='));
        if (roleCookie && roleCookie.split('=')[1] === 'Admin') {
          isAuthorized = true;
          isSuper = true;
        }

        if (userEmail && adminEmail && userEmail.toLowerCase() === adminEmail.toLowerCase()) {
          isAuthorized = true;
          isSuper = true;
        }

        // Check extra admins added from UI
        if (userEmail && !isAuthorized) {
           const extraAdminsStr = localStorage.getItem("cf_extra_admins");
           if (extraAdminsStr) {
             const extraAdmins = JSON.parse(extraAdminsStr);
             if (extraAdmins.includes(userEmail.toLowerCase())) {
               isAuthorized = true;
               isSuper = true;
             }
           }
        }

        // Verify with server if we have an email
        if (userEmail && (!adminEmail || userEmail.toLowerCase() !== adminEmail.toLowerCase())) {
          try {
            const res = await fetch(`/api/users?t=${Date.now()}`, { cache: 'no-store' });
            if (res.ok) {
              const users = await res.json();
              const serverUser = users.find((u: any) => u.email.toLowerCase() === userEmail.toLowerCase());
              if (serverUser) {
                // Override local authorization based on server truth
                if (serverUser.role === 'Admin' && serverUser.status === 'Active') {
                   isAuthorized = true;
                   isSuper = true;
                   
                   // Update the cookies so middleware stops blocking them!
                   if (!roleCookie || roleCookie.split('=')[1] !== 'Admin') {
                     document.cookie = "cf_auth_role=Admin; path=/; max-age=86400;";
                     document.cookie = "cf_auth_status=Active; path=/; max-age=86400;";
                     // Call refresh endpoint to update JWT session cookie invisibly
                     fetch('/api/auth/refresh', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ email: userEmail })
                     }).then(() => window.location.reload()).catch(() => {});
                   }
                } else {
                   isAuthorized = false;
                   isSuper = false;
                   
                   // Clear stale cookie if they are no longer admin
                   if (roleCookie && roleCookie.split('=')[1] === 'Admin') {
                     document.cookie = "cf_auth_role=User; path=/; max-age=86400;";
                     
                     // Call refresh endpoint to update JWT session cookie invisibly
                     fetch('/api/auth/refresh', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ email: userEmail })
                     }).then(() => window.location.reload()).catch(() => {});
                   }
                   
                   // Remove from extra admins
                   const extraAdminsStr = localStorage.getItem("cf_extra_admins");
                   if (extraAdminsStr) {
                     let extraAdmins = JSON.parse(extraAdminsStr);
                     extraAdmins = extraAdmins.filter((e: string) => e !== userEmail.toLowerCase());
                     localStorage.setItem("cf_extra_admins", JSON.stringify(extraAdmins));
                   }
                }
              }
            }
          } catch (e) {
             // Fallback to local
          }
        }

        if (isAuthorized) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        setIsSuperAdmin(isSuper);
      } catch (err) {
        console.error("Failed to check admin status", err);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, []);

  return { isAdmin, isSuperAdmin, loading };
}

