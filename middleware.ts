/* eslint-disable @typescript-eslint/no-explicit-any */
// middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// Define role hierarchy
const ROLES = {
  USER: 'user',
  AUTHOR: 'author',
  EDITOR: 'editor',
  REVIEWER: 'reviewer',
  ADMIN: 'admin'
} as const;

// Role permissions map
const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.USER]: [],
  [ROLES.AUTHOR]: ['businesses.create', 'requirements.create', 'products.create'],
  [ROLES.EDITOR]: ['businesses.*', 'requirements.*', 'products.*', 'vendors.*'],
  [ROLES.REVIEWER]: ['comments.moderate', 'reviews.moderate'],
  [ROLES.ADMIN]: ['*']
};

// Check if user has required permission
function hasPermission(userRole: string, requiredPermission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];

  if (permissions.includes('*')) return true;
  if (permissions.includes(requiredPermission)) return true;

  const hasWildcard = permissions.some(perm => {
    if (perm.endsWith('.*')) {
      const prefix = perm.slice(0, -2);
      return requiredPermission.startsWith(prefix);
    }
    return false;
  });

  return hasWildcard;
}

// Check if role can access admin area
function canAccessAdmin(role: string): boolean {
  return [ROLES.AUTHOR, ROLES.EDITOR, ROLES.REVIEWER, ROLES.ADMIN].includes(role as any);
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 🚨 CRITICAL: Skip ALL NextAuth routes (including callback routes)
  if (path.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Get token with proper secret
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production'
  });
  
  const isAuthenticated = !!token;
  const userRole = ((token?.role as string) || ROLES.USER) as
    | 'author'
    | 'editor'
    | 'reviewer'
    | 'admin'
    | 'user';

  // Define route patterns
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  const authRoutes = ['/signin', '/signup'];
  const adminRoutes = ['/admin'];

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAuthRoute = authRoutes.some(route => path === route);
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));

  // 🔐 Handle auth routes - redirect authenticated users away from signin/signup
  // BUT: Only redirect if this is a direct visit, not part of OAuth flow
  if (isAuthRoute && isAuthenticated) {
    // Check if there's a callbackUrl or error parameter (OAuth flow indicators)
    const hasCallbackUrl = req.nextUrl.searchParams.has('callbackUrl');
    const hasError = req.nextUrl.searchParams.has('error');
    
    // Don't redirect during OAuth flow
    if (!hasCallbackUrl && !hasError) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // 🔐 Handle admin routes
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const callbackUrl = encodeURIComponent(path);
      return NextResponse.redirect(new URL(`/signin?callbackUrl=${callbackUrl}`, req.url));
    }

    if (!canAccessAdmin(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    const specificPermissions: Record<string, string[]> = {
      '/admin/users': ['users.*', '*'],
      '/admin/businesses': ['businesses.*', '*'],
      '/admin/products': ['products.*', '*'],
      '/admin/requirements': ['requirements.*', '*'],
      '/admin/vendors': ['vendors.*', '*'],
      '/admin/comments': ['comments.moderate', '*'],
      '/admin/reviews': ['reviews.moderate', '*'],
    };

    for (const [route, perms] of Object.entries(specificPermissions)) {
      if (path.startsWith(route)) {
        const hasRequiredPerm = perms.some(perm => hasPermission(userRole, perm));
        if (!hasRequiredPerm) {
          return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
        }
      }
    }

    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    return response;
  }

  // 🔐 Handle regular protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(path);
    return NextResponse.redirect(new URL(`/signin?callbackUrl=${callbackUrl}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/signin',
    '/signup'
  ],
};