import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

async function getOrCreateConfig() {
  let config = await prisma.outreach_scheduler_config.findFirst();
  if (!config) {
    config = await prisma.outreach_scheduler_config.create({
      data: {},
    });
  }
  return config;
}

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();

    const config = await getOrCreateConfig();

    const recentRuns = await prisma.outreach_runs.findMany({
      orderBy: { run_at: 'desc' },
      take: 20,
    });

    // Queue depth: prospects that are NEW or NO_RESPONSE and have email, not contacted within cooldown
    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - config.contact_cooldown_days);

    const queueDepth = await prisma.prospects.count({
      where: {
        status: { in: ['NEW', 'NO_RESPONSE'] },
        email: { not: null },
        OR: [
          { last_contacted_at: null },
          { last_contacted_at: { lt: cooldownDate } },
        ],
      },
    });

    return NextResponse.json({ config, recentRuns, queueDepth });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const config = await getOrCreateConfig();

    const allowed = ['is_paused', 'daily_cap', 'contact_cooldown_days', 'template_slug'];
    const data: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }

    const updated = await prisma.outreach_scheduler_config.update({
      where: { id: config.id },
      data,
    });

    return NextResponse.json({ config: updated });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
