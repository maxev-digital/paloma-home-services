import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();

    const invoice = await prisma.manual_invoices.findUnique({
      where: { id: params.id },
      include: {
        line_items: { orderBy: { sort_order: 'asc' } },
        payments: { orderBy: { paid_at: 'desc' } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();

    const allowed = [
      'customer_name', 'customer_phone', 'customer_email', 'customer_address',
      'property_address', 'notes', 'payment_terms', 'status', 'amount_due',
      'amount_paid', 'due_at', 'paid_at',
    ];
    const data: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if ((key === 'due_at' || key === 'paid_at') && body[key]) {
          data[key] = new Date(body[key]);
        } else {
          data[key] = body[key];
        }
      }
    }

    const invoice = await prisma.manual_invoices.update({
      where: { id: params.id },
      data,
      include: {
        line_items: { orderBy: { sort_order: 'asc' } },
        payments: { orderBy: { paid_at: 'desc' } },
      },
    });

    return NextResponse.json({ invoice });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await prisma.manual_invoices.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
