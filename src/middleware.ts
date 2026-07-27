import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  // Check for the secure authentication cookie
  const authToken = request.cookies.get('cf_auth_token');
  const role = request.cookies.get('cf_auth_role')?.value;
  const status = request.cookies.get('cf_auth_status')?.value;
  const sessionCookie = request.cookies.get('cf_session')?.value;
  const path = request.nextUrl.pathname;

  // Define route groups
  const isPublicPath = path === '/login' || path === '/';
  const isPendingPage = path === '/pending-approval';
  
  // Bypass auth routes
  if (path.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  // --- 1. Fetch fresh DB status if session exists ---
  let currentRole = role;
  let currentStatus = status;
  let isStateChanged = false;
  let currentEmail = '';
  let isSuperAdmin = false;

  if (sessionCookie) {
    try {
      const secretKey = process.env.JWT_SECRET;
      const key = new TextEncoder().encode(secretKey || 'default_jwt_secret_trust_traders_2026');
      
      const { payload } = await jwtVerify(sessionCookie, key, {
        algorithms: ['HS256'],
      });

      currentEmail = payload.email as string;
      isSuperAdmin = !!payload.isSuperAdmin;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project-id')) {
        try {
          const res = await fetch(`${supabaseUrl}/rest/v1/custom_users?email=eq.${encodeURIComponent(currentEmail)}&select=role,status`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            cache: 'no-store'
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              const freshRole = data[0].role;
              const freshStatus = data[0].status;
              
              if (freshRole !== role || freshStatus !== status) {
                currentRole = freshRole;
                currentStatus = freshStatus;
                isStateChanged = true;
              }
            } else if (path.startsWith('/api/')) {
              return NextResponse.json({ error: 'Unauthorized - User not found' }, { status: 401 });
            } else {
              // User deleted, force logout on UI
              currentRole = '';
              currentStatus = '';
              isStateChanged = true;
            }
          }
        } catch (e) {
          console.warn('Middleware DB fetch failed:', e);
        }
      }
    } catch (error) {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized - Invalid Token' }, { status: 401 });
      }
      // For UI routes, let it fall through, the check below will redirect to login
    }
  } else if (path.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized - Missing Token' }, { status: 401 });
  }

  // --- 2. API Route Protection ---
  if (path.startsWith('/api/') && !path.startsWith('/api/auth/')) {

    if (path === '/api/ping') {
      return NextResponse.json({
        ok: true,
        changed: isStateChanged,
        role: currentRole,
        status: currentStatus
      });
    }

    // Verify status is Active. Inactive/Hold users cannot access APIs.
    // (Except during initial setup where status is checked, but here we enforce Active)
    if (currentStatus !== 'Active') {
      return NextResponse.json({ error: 'Forbidden - Account pending approval or inactive' }, { status: 403 });
    }

    const isBusinessApi = path.startsWith('/api/transactions') || 
                          path.startsWith('/api/orders') || 
                          path.startsWith('/api/chalans') || 
                          path.startsWith('/api/documents') ||
                          path.startsWith('/api/users') ||
                          path.startsWith('/api/settings');
                          
    if (isBusinessApi && currentRole !== 'Admin') {
      return NextResponse.json({ error: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-email', currentEmail);
    requestHeaders.set('x-user-role', currentRole || '');
    requestHeaders.set('x-user-status', currentStatus || '');
    requestHeaders.set('x-super-admin', isSuperAdmin ? 'true' : 'false');

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    return response;
  }
  
  // --- 3. UI Route Protection ---
  const isUserAllowedPath = path === '/' || path === '/about' || path === '/settings' || isPendingPage;
  let response = NextResponse.next();

  // If status/role changed in DB, we must redirect to apply cookies properly or just update cookies
  // But wait, if they are on pending-approval and they became active, we should redirect them to /dashboard!
  let shouldRedirect = false;
  let redirectUrl = request.url;

  // Unauthenticated
  if (!isPublicPath && (!authToken || !sessionCookie || !currentStatus)) {
    shouldRedirect = true;
    redirectUrl = new URL('/login', request.url).toString();
  } 
  // Authenticated going to login
  else if (path === '/login' && authToken && currentStatus) {
    shouldRedirect = true;
    if (currentStatus === 'Hold') redirectUrl = new URL('/pending-approval', request.url).toString();
    else if (currentRole === 'User') redirectUrl = new URL('/', request.url).toString();
    else redirectUrl = new URL('/dashboard', request.url).toString();
  }
  // Hold users
  else if (authToken && currentStatus === 'Hold' && !isPendingPage) {
    shouldRedirect = true;
    redirectUrl = new URL('/pending-approval', request.url).toString();
  }
  // Active Users on pending-approval
  else if (authToken && currentStatus === 'Active' && isPendingPage) {
    shouldRedirect = true;
    redirectUrl = new URL(currentRole === 'User' ? '/' : '/dashboard', request.url).toString();
  }
  // Role enforcement for User
  else if (authToken && currentStatus === 'Active' && currentRole === 'User' && !isUserAllowedPath) {
    shouldRedirect = true;
    redirectUrl = new URL('/', request.url).toString();
  }

  if (shouldRedirect) {
    response = NextResponse.redirect(redirectUrl);
  }

  // If state changed, update cookies!
  if (isStateChanged) {
    if (!currentStatus) {
      // User was deleted or invalidated
      response.cookies.delete('cf_auth_token');
      response.cookies.delete('cf_auth_role');
      response.cookies.delete('cf_auth_status');
      response.cookies.delete('cf_session');
    } else {
      response.cookies.set('cf_auth_role', currentRole as string, { path: '/' });
      response.cookies.set('cf_auth_status', currentStatus as string, { path: '/' });
    }
  }

  // Clear invalid cookies if unauthenticated
  if (!isPublicPath && authToken && !sessionCookie) {
    response.cookies.delete('cf_auth_token');
    response.cookies.delete('cf_auth_role');
    response.cookies.delete('cf_auth_status');
  }

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
