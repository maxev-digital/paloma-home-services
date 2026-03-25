import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const status = searchParams.get('status');
    const hasEmail = searchParams.get('has_email');
    const hasPhone = searchParams.get('has_phone');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== 'ALL') where.status = status;
    if (category && category !== 'ALL') where.category = category;
    if (city) where.city = { contains: city, mode: 'insensitive' };

    if (hasEmail === 'true') where.email = { not: null };
    if (hasPhone === 'true') where.phone = { not: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [businesses, total, categoriesRaw] = await Promise.all([
      prisma.business_directory.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.business_directory.count({ where }),
      prisma.business_directory.findMany({
        where: { category: { not: null } },
        distinct: ['category'],
        select: { category: true },
        orderBy: { category: 'asc' },
      }),
    ]);

    const categories = categoriesRaw
      .map((c: { category: string | null }) => c.category)
      .filter(Boolean) as string[];

    return NextResponse.json({
      businesses,
      total,
      page,
      pages: Math.ceil(total / limit),
      categories,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
