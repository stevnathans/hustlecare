// middleware.ts - MINIMAL VERSION FOR TESTING
// Use this temporarily to see if middleware is causing the issue

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  console.log('🔍 Middleware hit:', path);

  // CRITICAL: Skip ALL NextAuth routes
  if (path.startsWith('/api/auth')) {
    console.log('✅ Skipping auth route');
    return NextResponse.next();
  }

  // For now, allow everything else through
  // We'll add protection back once OAuth works
  console.log('✅ Allowing route');
  return NextResponse.next();
}

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