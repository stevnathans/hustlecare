/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getActivityProgress,
  getNeedsAttention,
  getRequirementGapItems,
  getTodayTasks,
  getDraftItems,
} from '@/lib/execution-tracker';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !['editor', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [activities, needsAttentionBase, requirementGaps, tasks, draftItems] = await Promise.all([
    getActivityProgress(),
    getNeedsAttention(),
    getRequirementGapItems(),
    getTodayTasks(),
    getDraftItems(),
  ]);

  const needsAttention = [...needsAttentionBase, ...requirementGaps];
  const daily = activities.filter((a) => a.cadence === 'DAILY');
  const metCount = daily.filter((a) => a.isMet).length;

  return NextResponse.json({
    date: new Date().toISOString(),
    activities,
    summary: { totalDaily: daily.length, metDaily: metCount },
    needsAttention,
    draftItems,
    tasks,
  });
}