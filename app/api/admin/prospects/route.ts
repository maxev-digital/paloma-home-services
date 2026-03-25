import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const source = searchParams.get('source');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { neighborhood: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [prospects, total] = await Promise.all([
      prisma.prospects.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { outreach_history: true } },
        },
      }),
      prisma.prospects.count({ where }),
    ]);

    return NextResponse.json({ prospects, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { name, address, city, neighborhood, zip, phone, email, source, notes } = await req.json();

    if (!address || !city) {
      return NextResponse.json({ error: 'address and city are required' }, { status: 400 });
    }

    const prospect = await prisma.prospects.create({
      data: {
        name: name || null,
        address,
        city,
        neighborhood: neighborhood || null,
        zip: zip || null,
        phone: phone || null,
        email: email || null,
        source: source || 'manual',
        notes: notes || null,
      },
    });

    return NextResponse.json({ prospect });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
