import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();

    const [sent, pendingJobs] = await Promise.all([
      prisma.review_requests.findMany({
        include: {
          job: {
            select: {
              id: true,
              address: true,
              customer: { select: { id: true, name: true, phone: true } },
            },
          },
        },
        orderBy: { sent_at: 'desc' },
      }),
      prisma.jobs.findMany({
        where: {
          status: 'COMPLETE',
          review_request: null,
        },
        select: {
          id: true,
          address: true,
          completed_date: true,
          customer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { completed_date: 'desc' },
      }),
    ]);

    return NextResponse.json({ sent, pendingJobs });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { job_id, sent_via } = await req.json();

    if (!job_id) {
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
    }

    const existing = await prisma.review_requests.findUnique({ where: { job_id } });
    if (existing) {
      return NextResponse.json({ error: 'Review request already exists for this job' }, { status: 400 });
    }

    const reviewRequest = await prisma.review_requests.create({
      data: {
        job_id,
        sent_via: sent_via || 'EMAIL',
      },
      include: {
        job: {
          select: {
            id: true,
            address: true,
            customer: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });

    return NextResponse.json({ reviewRequest });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
