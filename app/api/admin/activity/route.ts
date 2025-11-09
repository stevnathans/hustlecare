// app/api/admin/activity/route.ts
import { NextResponse } from 'next/server';
import { getAuditLogs, requirePermission } from '@/lib/admin-utils';

export async function GET() {
  try {
    // Verify user has admin access
    await requirePermission('audit.view');

    // Fetch recent audit logs
    const { logs } = await getAuditLogs({
      limit: 10,
      offset: 0,
    });

    // Transform audit logs into activity format
    const activities = logs.map(log => ({
      id: log.id,
      action: formatAction(log.action, log.entity),
      entity: log.entity,
      user: log.user.name || log.user.email,
      timestamp: log.createdAt.toISOString(),
    }));

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching admin activity:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to format action text
function formatAction(action: string, entity: string): string {
  const actionMap: Record<string, string> = {
    CREATE: 'created',
    UPDATE: 'updated',
    DELETE: 'deleted',
    VIEW: 'viewed',
    EXPORT: 'exported',
    APPROVE: 'approved',
    REJECT: 'rejected',
  };

  const actionText = actionMap[action] || action.toLowerCase();
  return `${actionText} ${entity.toLowerCase()}`;
}