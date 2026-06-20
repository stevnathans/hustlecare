/* eslint-disable @typescript-eslint/no-explicit-any */
// proxy.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redirectCacheInvalidatedAt } from '@/app/api/admin/redirects/route';

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

function canAccessAdmin(role: string): boolean {
  return role === ROLES.ADMIN;
}

function safeCallbackUrl(path: string, requestUrl: string): string {
  try {
    const base = new URL(requestUrl);
    const resolved = new URL(path, base);
    if (resolved.origin !== base.origin) return '/dashboard';
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
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  return response;
}

// ── DB-driven redirects ───────────────────────────────────────────────────────
type RedirectEntry = { source: string; destination: string; permanent: boolean };

let redirectCache: RedirectEntry[] = [];
let redirectCacheSnapshot: number = -1;

async function getRedirects(): Promise<RedirectEntry[]> {
  try {
    // FIX: Compare against the exported timestamp from the API route instead
    // of querying a RedirectCache DB table (which required a schema change).
    // When any mutation occurs, the API route updates redirectCacheInvalidatedAt,
    // proxy.ts detects the change on the next request and re-fetches from DB.
    if (redirectCacheSnapshot !== redirectCacheInvalidatedAt) {
      const rows = await prisma.redirect.findMany({
        select: { source: true, destination: true, permanent: true },
      });
      redirectCache = rows;
      redirectCacheSnapshot = redirectCacheInvalidatedAt;
    }
  } catch {
    // Non-fatal: serve stale cache if DB is unavailable
  }
  return redirectCache;
}

async function applyDbRedirect(req: NextRequest): Promise<NextResponse | null> {
  const path = req.nextUrl.pathname;
  const redirects = await getRedirects();
  const match = redirects.find(r => r.source === path);
  if (!match) return null;

  const destination = match.destination.startsWith('/')
    ? new URL(match.destination, req.url).toString()
    : match.destination;

  return NextResponse.redirect(destination, { status: match.permanent ? 308 : 307 });
}
// ─────────────────────────────────────────────────────────────────────────────

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (path.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  if (!path.startsWith('/api') && !path.startsWith('/admin')) {
    const redirectResponse = await applyDbRedirect(req);
    if (redirectResponse) return redirectResponse;
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

    const specificPermissions: Record<string, string[]> = {
      '/admin':              ['*'],
      '/admin/users':        ['users.*', '*'],
      '/admin/businesses':   ['businesses.*', '*'],
      '/admin/products':     ['products.*', '*'],
      '/admin/requirements': ['requirements.*', '*'],
      '/admin/vendors':      ['vendors.*', '*'],
      '/admin/comments':     ['comments.moderate', '*'],
      '/admin/reviews':      ['reviews.moderate', '*'],
      '/admin/redirects':    ['settings.manage', '*'],
    };

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

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/admin/:path*',
    '/signin',
    '/signup',
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};