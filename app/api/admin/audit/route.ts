// app/api/admin/audit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs, requirePermission, AuditAction, AuditEntity } from '@/lib/admin-utils';

export async function GET(request: NextRequest) {
  try {
    await requirePermission('audit.view');

    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25));
    const action = (searchParams.get('action') || undefined) as AuditAction | undefined;
    const entity = (searchParams.get('entity') || undefined) as AuditEntity | undefined;
    const userId = searchParams.get('userId') || undefined;
    const search = searchParams.get('search') || undefined;
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam   = searchParams.get('dateTo');

    const startDate = dateFromParam ? new Date(dateFromParam) : undefined;
    const endDate = dateToParam ? new Date(dateToParam) : undefined;

    const { logs, total } = await getAuditLogs({
      limit,
      offset: (page - 1) * limit,
      action,
      entity,
      userId,
      search,
      startDate: startDate && !isNaN(startDate.getTime()) ? startDate : undefined,
      endDate: endDate && !isNaN(endDate.getTime()) ? endDate : undefined,
    });

    const items = logs.map(log => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      user: log.user.name || log.user.email,
      userImage: log.user.image,
      timestamp: log.createdAt.toISOString(),
      changes: log.changes as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
    }));

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    }
    console.error('Error fetching audit logs:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}