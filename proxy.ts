/* eslint-disable @typescript-eslint/no-explicit-any */
// proxy.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const ROLES = {
  USER: 'user',
  AUTHOR: 'author',
  EDITOR: 'editor',
  REVIEWER: 'reviewer',
  ADMIN: 'admin'
} as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.USER]: [],
  [ROLES.AUTHOR]: ['businesses.create', 'requirements.create', 'products.create'],
  [ROLES.EDITOR]: ['businesses.*', 'requirements.*', 'products.*', 'vendors.*'],
  [ROLES.REVIEWER]: ['comments.moderate', 'reviews.moderate'],
  [ROLES.ADMIN]: ['*']
};

function hasPermission(userRole: string, requiredPermission: string): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  if (permissions.includes('*')) return true;
  if (permissions.includes(requiredPermission)) return true;
  return permissions.some(perm => {
    if (perm.endsWith('.*')) {
      const prefix = perm.slice(0, -2);
      return requiredPermission.startsWith(prefix);
    }
    return false;
  });
}

// FIX: Only true admins can access the admin area.
// Previously author/editor/reviewer were granted entry, meaning
// any new /admin/* page was accessible to them unless explicitly blocked.
function canAccessAdmin(role: string): boolean {
  return role === ROLES.ADMIN;
}

// FIX: Validate callbackUrl is a same-origin relative path to prevent open redirects.
// Previously the raw pathname was passed directly into the redirect URL.
function safeCallbackUrl(path: string, requestUrl: string): string {
  try {
    const base = new URL(requestUrl);
    const resolved = new URL(path, base);
    if (resolved.origin !== base.origin) return '/dashboard';
    // Only allow paths, never full URLs
    return resolved.pathname;
  } catch {
    return '/dashboard';
  }
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  // FIX: Added HSTS. Previously absent entirely.
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  return response;
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path.startsWith('/api/auth')) {
    return NextResponse.next();
  }

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

  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  const authRoutes = ['/signin', '/signup'];
  const adminRoutes = ['/admin'];

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAuthRoute = authRoutes.some(route => path === route);
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));

  // FIX: Removed the OAuth flow bypass that allowed authenticated users to stay
  // on /signin by appending ?callbackUrl=anything. NextAuth handles continuation
  // internally; we don't need to inspect params here.
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (isAdminRoute) {
    if (!isAuthenticated) {
      const callbackUrl = encodeURIComponent(safeCallbackUrl(path, req.url));
      return NextResponse.redirect(new URL(`/signin?callbackUrl=${callbackUrl}`, req.url));
    }

    if (!canAccessAdmin(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    // FIX: Deny-by-default for admin sub-routes. Previously any new /admin/* page
    // added to the app was silently accessible to all roles that passed canAccessAdmin.
    // Now: if a route has no entry in the map, access is denied.
    const specificPermissions: Record<string, string[]> = {
      '/admin':                ['*'],
      '/admin/users':          ['users.*', '*'],
      '/admin/businesses':     ['businesses.*', '*'],
      '/admin/products':       ['products.*', '*'],
      '/admin/requirements':   ['requirements.*', '*'],
      '/admin/vendors':        ['vendors.*', '*'],
      '/admin/comments':       ['comments.moderate', '*'],
      '/admin/reviews':        ['reviews.moderate', '*'],
    };

    // Match longest prefix first so /admin/users beats /admin
    const matchedRoute = Object.keys(specificPermissions)
      .sort((a, b) => b.length - a.length)
      .find(route => path.startsWith(route));

    if (!matchedRoute) {
      return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
    }

    const hasRequiredPerm = specificPermissions[matchedRoute]
      .some(perm => hasPermission(userRole, perm));

    if (!hasRequiredPerm) {
      return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
    }

    return applySecurityHeaders(NextResponse.next());
  }

  if (isProtectedRoute && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(safeCallbackUrl(path, req.url));
    return NextResponse.redirect(new URL(`/signin?callbackUrl=${callbackUrl}`, req.url));
  }

  // FIX: Apply security headers to ALL responses, not just admin routes.
  // Previously dashboard, profile, settings and public pages had no security headers.
  return applySecurityHeaders(NextResponse.next());
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