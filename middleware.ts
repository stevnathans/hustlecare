/* eslint-disable @typescript-eslint/no-explicit-any */
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

// Permission checker
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

// Admin access checker
function canAccessAdmin(role: string): boolean {
  return [ROLES.AUTHOR, ROLES.EDITOR, ROLES.REVIEWER, ROLES.ADMIN].includes(role as any);
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 🚨 CRITICAL: NEVER interfere with auth routes or OAuth flow
  if (
    path.startsWith('/api/auth') ||
    path.startsWith('/signin') ||
    path.startsWith('/signup')
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET
  });

  const isAuthenticated = !!token;
  const userRole = ((token?.role as string) || ROLES.USER) as
    | "author"
    | "editor"
    | "reviewer"
    | "admin"
    | "user";

  // Route definitions
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  const adminRoutes = ['/admin'];

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));

  // 🔐 Admin protection
  if (isAdminRoute) {
    if (!isAuthenticated) {
      const callbackUrl = encodeURIComponent(path);
      return NextResponse.redirect(
        new URL(`/signin?callbackUrl=${callbackUrl}`, req.url)
      );
    }

    if (!canAccessAdmin(userRole)) {
      return NextResponse.redirect(
        new URL('/unauthorized', req.url)
      );
    }

    // Specific permission checks
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
        const hasRequiredPerm = perms.some(perm =>
          hasPermission(userRole, perm)
        );

        if (!hasRequiredPerm) {
          return NextResponse.redirect(
            new URL('/admin/unauthorized', req.url)
          );
        }
      }
    }

    // Add admin security headers
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    return response;
  }

  // 🔐 Regular protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(path);
    return NextResponse.redirect(
      new URL(`/signin?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  return NextResponse.next();
}

// ✅ Updated matcher — auth routes removed
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/admin/:path*'
  ],
};
