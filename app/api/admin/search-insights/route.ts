// app/api/admin/search-insights/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-utils';

export async function GET() {
  try {
    await requirePermission('businesses.view');
    const misses = await prisma.searchLog.groupBy({
      by: ['keyword'],
      where: { resultCount: 0 },
      _count: { keyword: true },
      orderBy: { _count: { keyword: 'desc' } },
      take: 50,
    });
    return NextResponse.json(misses.map(m => ({ keyword: m.keyword, misses: m._count.keyword })));
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to load search insights.' }, { status: 500 });
  }
}