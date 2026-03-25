import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      estimatesTotal,
      estimatesLast30d,
      jobsTotal,
      jobsActive,
      jobsCompleted,
      customersTotal,
      customersLast30d,
      recentEstimates,
      jobStatusBreakdown,
    ] = await Promise.all([
      prisma.estimates.count(),
      prisma.estimates.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
      prisma.jobs.count(),
      prisma.jobs.count({ where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } } }),
      prisma.jobs.count({ where: { status: 'COMPLETE' } }),
      prisma.customers.count(),
      prisma.customers.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
      prisma.estimates.findMany({
        where: { created_at: { gte: ninetyDaysAgo } },
        select: { created_at: true, total: true },
        orderBy: { created_at: 'asc' },
      }),
      prisma.jobs.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    // Build weekly chart from last 90 days of estimates
    const weeklyMap: Record<string, { count: number; total: number }> = {};
    for (const est of recentEstimates) {
      const d = new Date(est.created_at);
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((day + 6) % 7));
      const key = monday.toISOString().slice(0, 10);
      if (!weeklyMap[key]) weeklyMap[key] = { count: 0, total: 0 };
      weeklyMap[key].count++;
      weeklyMap[key].total += est.total;
    }
    const weeklyChart = Object.entries(weeklyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({ week, count: data.count, total: Math.round(data.total * 100) / 100 }));

    return NextResponse.json({
      estimates: { total: estimatesTotal, last30d: estimatesLast30d },
      jobs: { total: jobsTotal, active: jobsActive, completed: jobsCompleted },
      customers: { total: customersTotal, last30d: customersLast30d },
      weeklyChart,
      jobStatusBreakdown: jobStatusBreakdown.map(r => ({ status: r.status, count: r._count.id })),
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
