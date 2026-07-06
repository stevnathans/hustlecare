// app/api/business/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const limit = Math.min(Number(searchParams.get('limit')) || 8, 20);

  if (q.length < 2) return NextResponse.json([]);

  try {
    // Two-pass ranking: exact-prefix matches ("Bak..." → "Bakery") outrank
    // mid-string matches ("...bak..." → "Kombucha Bakery") without needing
    // a full-text search engine yet.
    const [prefixMatches, containsMatches] = await Promise.all([
      prisma.business.findMany({
        where: { published: true, name: { startsWith: q, mode: 'insensitive' } },
        select: {
          id: true, name: true, slug: true, image: true,
          costMin: true, costMax: true,
          category: { select: { name: true, slug: true } },
          _count: { select: { requirements: true } },
        },
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.business.findMany({
        where: {
          published: true,
          name: { contains: q, mode: 'insensitive' },
          NOT: { name: { startsWith: q, mode: 'insensitive' } },
        },
        select: {
          id: true, name: true, slug: true, image: true,
          costMin: true, costMax: true,
          category: { select: { name: true, slug: true } },
          _count: { select: { requirements: true } },
        },
        take: limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    const results = [...prefixMatches, ...containsMatches].slice(0, limit);

    // Fire-and-forget: log every search, hit or miss. resultCount:0 rows
    // become your content backlog — see the admin insight route below.
    const session = await getServerSession(authOptions).catch(() => null);
    const ip = request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || null;
    prisma.searchLog
      .create({
        data: {
          keyword: q,
          userId: session?.user?.id ?? null,
          businessId: results[0]?.id ?? null,
          ipAddress: ip,
          userAgent: request.headers.get('user-agent') || null,
          resultCount: results.length,
        },
      })
      .catch((err) => console.error('[search] log failed', err));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching businesses:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}