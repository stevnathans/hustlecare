import { prisma } from '@/lib/prisma';
import { ActivitySourceType, ActivityCadence } from '@prisma/client';

export function getPeriodBounds(cadence: ActivityCadence, date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (cadence === 'DAILY') {
    const end = new Date(d);
    end.setDate(end.getDate() + 1);
    return { start: d, end };
  }

  if (cadence === 'WEEKLY') {
    const day = d.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(d);
    start.setDate(d.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }

  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start, end };
}

function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function getPreviousApplicableDate(activity: { cadence: ActivityCadence; weekdaysOnly: boolean }, date: Date): Date | null {
  if (activity.cadence !== 'DAILY') return null; // carryover only applies to DAILY targets
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  if (activity.weekdaysOnly) {
    while (isWeekend(prev)) prev.setDate(prev.getDate() - 1);
  }
  return prev;
}

// Capped one-day backlog: measured against the activity's own BASE target,
// never against a previous day's already-inflated target. This is what
// keeps a multi-day miss streak from compounding — the carry can never
// exceed one full day's worth, no matter how many days were missed in a row.
async function getDeficitCarry(
  activity: { id: number; sourceType: ActivitySourceType; cadence: ActivityCadence; weekdaysOnly: boolean; defaultTarget: number },
  date: Date
): Promise<number> {
  const prevDate = getPreviousApplicableDate(activity, date);
  if (!prevDate) return 0;

  const { start, end } = getPeriodBounds('DAILY', prevDate);
  const prevCompleted =
    activity.sourceType === 'MANUAL'
      ? await getManualCount(activity.id, start, end)
      : await getAutoCount(activity.sourceType, start, end);

  return Math.max(0, activity.defaultTarget - prevCompleted);
}

// Locks in today's effective target (base + capped carry) the first time
// today is touched, so it doesn't shift mid-day as completions come in.
async function ensureSnapshot(
  activity: { id: number; sourceType: ActivitySourceType; cadence: ActivityCadence; weekdaysOnly: boolean; defaultTarget: number },
  date: Date,
  start: Date,
  end: Date
) {
  const carryOver = await getDeficitCarry(activity, date);
  const targetValue = activity.defaultTarget + carryOver;
  return prisma.activityPeriodSnapshot.upsert({
    where: { activityId_periodStart: { activityId: activity.id, periodStart: start } },
    update: {},
    create: { activityId: activity.id, periodStart: start, periodEnd: end, targetValue },
  });
}

async function getAutoCount(sourceType: ActivitySourceType, start: Date, end: Date): Promise<number> {
  const inRange = { gte: start, lt: end };
  switch (sourceType) {
    case 'AUTO_BUSINESS':
      return prisma.business.count({ where: { published: true, publishedAt: inRange } });
    case 'AUTO_GUIDE':
      return prisma.howToGuide.count({ where: { isPublished: true, publishedAt: inRange } });
    case 'AUTO_PRODUCT':
      return prisma.product.count({ where: { status: 'ACTIVE', publishedAt: inRange } });
    case 'AUTO_LEGAL_SCHEDULE':
      return prisma.legalFeeSchedule.count({ where: { createdAt: inRange } });
    default:
      return 0;
  }
}

async function getManualCount(activityId: number, start: Date, end: Date): Promise<number> {
  const agg = await prisma.activityCompletion.aggregate({
    where: { activityId, completedAt: { gte: start, lt: end } },
    _sum: { count: true },
  });
  return agg._sum.count ?? 0;
}

export type ActivityProgress = {
  id: number;
  name: string;
  sourceType: ActivitySourceType;
  cadence: ActivityCadence;
  color: string | null;
  target: number;
  completed: number;
  isMet: boolean;
  carriedOver: number; // how much of `target` is backlog from yesterday, for the "behind" banner
};

export async function getActivityProgress(date = new Date()): Promise<ActivityProgress[]> {
  const activities = await prisma.activity.findMany({ where: { isActive: true }, orderBy: { id: 'asc' } });

  return Promise.all(
    activities
      .filter((a) => !(a.weekdaysOnly && [0, 6].includes(date.getDay())))
      .map(async (a) => {
        const { start, end } = getPeriodBounds(a.cadence, date);
        const snap = await ensureSnapshot(a, date, start, end);
        const target = snap.targetValue;
        const completed =
          a.sourceType === 'MANUAL'
            ? await getManualCount(a.id, start, end)
            : await getAutoCount(a.sourceType, start, end);
        return {
          id: a.id,
          name: a.name,
          sourceType: a.sourceType,
          cadence: a.cadence,
          color: a.color,
          target,
          completed,
          isMet: completed >= target,
          carriedOver: Math.max(0, target - a.defaultTarget),
        };
      })
  );
}

export type AttentionItem = { label: string; count: number; href: string; color: string };

export async function getNeedsAttention(): Promise<AttentionItem[]> {
  const [orders, vendorApps, suggestions, applyRequests] = await Promise.all([
    prisma.order.count({ where: { status: { in: ['PENDING_PAYMENT', 'PROCESSING'] } } }),
    prisma.vendorApplication.count({ where: { status: 'PENDING' } }),
    prisma.requirementSuggestion.count({ where: { status: 'PENDING' } }),
    prisma.applyAssistanceRequest.count({ where: { status: 'new' } }),
  ]);

  return [
    { label: 'Orders needing action', count: orders, href: '/admin/orders', color: '#818cf8' },
    { label: 'Vendor applications', count: vendorApps, href: '/admin/vendors', color: '#34d399' },
    { label: 'Requirement suggestions', count: suggestions, href: '/admin/requirements', color: '#fbbf24' },
    { label: 'Apply-help requests', count: applyRequests, href: '/admin/apply-requests', color: '#f87171' },
  ].filter((i) => i.count > 0);
}

export async function getRequirementGapItems(): Promise<AttentionItem[]> {
  const count = await prisma.business.count({
    where: {
      published: true,
      requirements: { some: {} },
      NOT: {
        requirements: {
          some: {
            isActive: true,
            template: { isGlobal: false, isDeprecated: false },
          },
        },
      },
    },
  });

  return count > 0
    ? [{
        label: 'Businesses with only global requirements',
        count,
        href: '/admin/businesses?filter=requirement-gap',
        color: '#fbbf24',
      }]
    : [];
}

export async function getDraftItems(): Promise<AttentionItem[]> {
  const [draftBusinesses, draftProducts, unpublishedGuides] = await Promise.all([
    prisma.business.count({ where: { published: false } }),
    prisma.product.count({ where: { status: { in: ['DRAFT', 'PENDING_REVIEW'] } } }),
    prisma.howToGuide.count({ where: { isPublished: false } }),
  ]);

  return [
    { label: 'Draft businesses', count: draftBusinesses, href: '/admin/businesses?filter=draft', color: '#818cf8' },
    { label: 'Products awaiting review', count: draftProducts, href: '/admin/products?filter=pending', color: '#fbbf24' },
    { label: 'Unpublished guides', count: unpublishedGuides, href: '/admin/guides?filter=draft', color: '#a78bfa' },
  ].filter((i) => i.count > 0);
}

export async function getTodayTasks() {
  return prisma.task.findMany({
    where: { status: { in: ['TODO', 'IN_PROGRESS'] } },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    include: {
      assignedTo: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });
}

// ── History ──────────────────────────────────────────────────────────
// Only DAILY-cadence activities are included — a "did I hit today's
// number" calendar doesn't map cleanly onto weekly/monthly targets, which
// get their own rollup later (Week/Month views, not built yet).
// Everything here is recomputed from the real tables, batched into a
// handful of queries for the whole window rather than one per day.

export type DayHistory = {
  date: string; // yyyy-mm-dd
  activities: { id: number; name: string; target: number; completed: number; isMet: boolean; sourceType: ActivitySourceType }[];
  metCount: number;
  totalDaily: number;
  allMet: boolean;
};

function dayKey(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function bump(map: Map<string, number>, key: string, n = 1) {
  map.set(key, (map.get(key) ?? 0) + n);
}

export async function getHistory(days = 30): Promise<DayHistory[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  const end = new Date(today);
  end.setDate(end.getDate() + 1); // exclusive, includes all of today

  const activities = await prisma.activity.findMany({
    where: { isActive: true, cadence: 'DAILY' },
    orderBy: { id: 'asc' },
  });

  const [businesses, guides, products, legalSchedules, completions, snapshots] = await Promise.all([
    prisma.business.findMany({ where: { published: true, publishedAt: { gte: start, lt: end } }, select: { publishedAt: true } }),
    prisma.howToGuide.findMany({ where: { isPublished: true, publishedAt: { gte: start, lt: end } }, select: { publishedAt: true } }),
    prisma.product.findMany({ where: { status: 'ACTIVE', publishedAt: { gte: start, lt: end } }, select: { publishedAt: true } }),
    prisma.legalFeeSchedule.findMany({ where: { createdAt: { gte: start, lt: end } }, select: { createdAt: true } }),
    prisma.activityCompletion.findMany({ where: { completedAt: { gte: start, lt: end } }, select: { activityId: true, count: true, completedAt: true } }),
    prisma.activityPeriodSnapshot.findMany({ where: { periodStart: { gte: start, lt: end } } }),
  ]);

  const autoBuckets: Record<string, Map<string, number>> = {
    AUTO_BUSINESS: new Map(),
    AUTO_GUIDE: new Map(),
    AUTO_PRODUCT: new Map(),
    AUTO_LEGAL_SCHEDULE: new Map(),
  };

  businesses.forEach((b) => b.publishedAt && bump(autoBuckets.AUTO_BUSINESS, dayKey(b.publishedAt)));
  guides.forEach((g) => g.publishedAt && bump(autoBuckets.AUTO_GUIDE, dayKey(g.publishedAt)));
  products.forEach((p) => p.publishedAt && bump(autoBuckets.AUTO_PRODUCT, dayKey(p.publishedAt)));
  legalSchedules.forEach((l) => bump(autoBuckets.AUTO_LEGAL_SCHEDULE, dayKey(l.createdAt)));

  const manualBuckets = new Map<number, Map<string, number>>();
  completions.forEach((c) => {
    if (!manualBuckets.has(c.activityId)) manualBuckets.set(c.activityId, new Map());
    bump(manualBuckets.get(c.activityId)!, dayKey(c.completedAt), c.count);
  });

  const snapshotMap = new Map<string, number>();
  snapshots.forEach((s) => snapshotMap.set(`${s.activityId}:${dayKey(s.periodStart)}`, s.targetValue));

  const result: DayHistory[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dayKey(d);
    const isWeekendDay = [0, 6].includes(d.getDay());

    const dayActivities = activities
      .filter((a) => !(a.weekdaysOnly && isWeekendDay))
      .map((a) => {
        const completed =
          a.sourceType === 'MANUAL'
            ? manualBuckets.get(a.id)?.get(key) ?? 0
            : autoBuckets[a.sourceType]?.get(key) ?? 0;
        // Fallback to defaultTarget for days the page was never opened
        // (so no snapshot was ever locked in) — best available estimate.
        const target = snapshotMap.get(`${a.id}:${key}`) ?? a.defaultTarget;
        return { id: a.id, name: a.name, target, completed, isMet: completed >= target, sourceType: a.sourceType };
      });

    const metCount = dayActivities.filter((x) => x.isMet).length;
    result.push({
      date: key,
      activities: dayActivities,
      metCount,
      totalDaily: dayActivities.length,
      allMet: dayActivities.length > 0 && metCount === dayActivities.length,
    });
  }

  return result;
}