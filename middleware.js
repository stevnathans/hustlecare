import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;
  
  // Get the pathname of the request
  const path = req.nextUrl.pathname;
  
  // Define protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  
  // Define auth routes
  const authRoutes = ['/auth/signin', '/auth/signup'];
  const isAuthRoute = authRoutes.some(route => path === route);
  
  // Redirect logic
  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to login if trying to access protected route while not authenticated
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }
  
  if (isAuthRoute && isAuthenticated) {
    // Redirect to dashboard if already authenticated and trying to access auth routes
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return NextResponse.next();
}

// Configure paths that middleware should run on
export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/settings/:path*', '/auth/:path*'],
};

