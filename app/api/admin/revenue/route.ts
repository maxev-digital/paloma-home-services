import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const revenueStatuses = ['APPROVED', 'INVOICED', 'PAID'];
    const pipelineStatuses = ['DRAFT', 'SENT'];

    const [allTimeAgg, thisMonthAgg, thisYearAgg, pipelineAgg, byStatusRaw, recentPaid] = await Promise.all([
      prisma.estimates.aggregate({
        where: { status: { in: revenueStatuses } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.estimates.aggregate({
        where: { status: { in: revenueStatuses }, created_at: { gte: startOfMonth } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.estimates.aggregate({
        where: { status: { in: revenueStatuses }, created_at: { gte: startOfYear } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.estimates.aggregate({
        where: { status: { in: pipelineStatuses } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.estimates.groupBy({
        by: ['status'],
        where: { status: { in: [...revenueStatuses, ...pipelineStatuses] } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.estimates.findMany({
        where: { status: { in: revenueStatuses } },
        include: { customer: { select: { id: true, name: true } } },
        orderBy: { updated_at: 'desc' },
        take: 10,
      }),
    ]);

    const byStatus = byStatusRaw.map(r => ({
      status: r.status,
      count: r._count.id,
      revenue: r._sum.total || 0,
    }));

    return NextResponse.json({
      allTime: { revenue: allTimeAgg._sum.total || 0, count: allTimeAgg._count.id },
      thisMonth: { revenue: thisMonthAgg._sum.total || 0, count: thisMonthAgg._count.id },
      thisYear: { revenue: thisYearAgg._sum.total || 0, count: thisYearAgg._count.id },
      pipeline: { revenue: pipelineAgg._sum.total || 0, count: pipelineAgg._count.id },
      byStatus,
      recentPaid,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
