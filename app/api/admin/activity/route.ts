// app/api/admin/activity/route.ts
import { NextResponse } from 'next/server';
import { getAuditLogs, requirePermission } from '@/lib/admin-utils';

export async function GET() {
  try {
    await requirePermission('audit.view');

    const { logs } = await getAuditLogs({ limit: 10, offset: 0 });

    const activities = logs.map(log => ({
      id: log.id,
      action: formatAction(log.action, log.entity),
      entity: log.entity,
      // FIX: log.user could be null if the user record was deleted after the
      // audit log was written. Previously log.user.name would throw and cause
      // a 500 for the entire activity feed.
      user: log.user?.name || log.user?.email || 'Deleted user',
      timestamp: log.createdAt.toISOString(),
    }));

    return NextResponse.json(activities);
  } catch (error) {
    // FIX: Replaced string-matching error handler with exact-match pattern
    // consistent with the rest of the codebase (from fixed admin-utils.ts).
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    }
    console.error('Error fetching admin activity:', (error as Error).message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatAction(action: string, entity: string): string {
  const actionMap: Record<string, string> = {
    CREATE:  'created',
    UPDATE:  'updated',
    DELETE:  'deleted',
    VIEW:    'viewed',
    EXPORT:  'exported',
    APPROVE: 'approved',
    REJECT:  'rejected',
  };
  return `${actionMap[action] ?? action.toLowerCase()} ${entity.toLowerCase()}`;
}