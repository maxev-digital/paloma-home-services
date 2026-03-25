import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { address: { contains: search, mode: 'insensitive' } },
        { inspector: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.inspection_reports.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          job: { select: { id: true, address: true } },
          _count: { select: { items: true, photos: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.inspection_reports.count({ where }),
    ]);

    return NextResponse.json({ reports, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { address, job_id, customer_id, inspector, inspection_date, weather, notes } = await req.json();

    if (!address) {
      return NextResponse.json({ error: 'address is required' }, { status: 400 });
    }

    const report = await prisma.inspection_reports.create({
      data: {
        address,
        job_id: job_id || null,
        customer_id: customer_id || null,
        inspector: inspector || null,
        inspection_date: inspection_date ? new Date(inspection_date) : null,
        weather: weather || null,
        notes: notes || null,
      },
      include: {
        customer: { select: { id: true, name: true } },
        job: { select: { id: true, address: true } },
      },
    });

    return NextResponse.json({ report });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
