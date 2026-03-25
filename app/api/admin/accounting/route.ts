import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();

    const estimates = await prisma.estimates.findMany({
      where: { status: { in: ['APPROVED', 'INVOICED', 'PAID'] } },
      include: {
        customer: { select: { id: true, name: true } },
        invoice: { include: { payments: true } },
        job_costs: true,
      },
      orderBy: { created_at: 'desc' },
    });

    let totalRevenue = 0;
    let totalCollected = 0;
    let totalCosts = 0;
    const allCostsByCategory: Record<string, number> = {};

    const rows = estimates.map(est => {
      const revenue = est.total;
      const collected = est.invoice?.payments.reduce((s, p) => s + p.amount, 0) || 0;
      const costs = est.job_costs.reduce((s, c) => s + c.amount, 0);
      const gross_profit = revenue - costs;
      const margin_pct = revenue > 0 ? (gross_profit / revenue) * 100 : 0;

      totalRevenue += revenue;
      totalCollected += collected;
      totalCosts += costs;

      const costs_by_category: Record<string, number> = {};
      for (const c of est.job_costs) {
        costs_by_category[c.category] = (costs_by_category[c.category] || 0) + c.amount;
        allCostsByCategory[c.category] = (allCostsByCategory[c.category] || 0) + c.amount;
      }

      return {
        id: est.id,
        customer: est.customer,
        address: est.address,
        status: est.status,
        revenue,
        collected,
        total_costs: costs,
        gross_profit,
        margin_pct: Math.round(margin_pct * 10) / 10,
        costs_by_category,
        created_at: est.created_at,
      };
    });

    const totalGrossProfit = totalRevenue - totalCosts;
    const totalMarginPct = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

    return NextResponse.json({
      rows,
      totals: {
        revenue: totalRevenue,
        collected: totalCollected,
        total_costs: totalCosts,
        gross_profit: totalGrossProfit,
        margin_pct: Math.round(totalMarginPct * 10) / 10,
        costs_by_category: allCostsByCategory,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
