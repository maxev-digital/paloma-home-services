import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();

    const templates = await prisma.outreach_templates.findMany({
      orderBy: [{ category: 'asc' }, { slug: 'asc' }],
      include: {
        _count: { select: { outreach_history: true } },
      },
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { slug, category, variant, subject, body, variables, is_active } = await req.json();

    if (!slug || !subject || !body) {
      return NextResponse.json({ error: 'slug, subject, and body are required' }, { status: 400 });
    }

    const template = await prisma.outreach_templates.create({
      data: {
        slug,
        category: category || 'general',
        variant: variant || 'default',
        subject,
        body,
        variables: variables || [],
        is_active: is_active !== undefined ? is_active : true,
      },
    });

    return NextResponse.json({ template });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
