// lib/admin-auth.ts
//
// Guard for /api/admin/* route handlers.
//
// WHY THIS EXISTS: proxy.ts only protects /admin PAGES. Its matcher
// deliberately excludes api/, so nothing in the proxy stops an anonymous
// request to an /api/admin/* endpoint. Every admin API route therefore has
// to check the session itself. Call requireAdmin() as the first line of
// each handler:
//
//   const auth = await requireAdmin();
//   if (!auth.ok) return auth.response;

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

type AdminCheck =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

export async function requireAdmin(): Promise<AdminCheck> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }),
    };
  }

  if (user.role !== 'admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not authorized.' }, { status: 403 }),
    };
  }

  return { ok: true, userId: user.id ?? '' };
}