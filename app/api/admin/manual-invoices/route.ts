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
        { customer_name: { contains: search, mode: 'insensitive' } },
        { invoice_no: { contains: search, mode: 'insensitive' } },
        { property_address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.manual_invoices.findMany({
        where,
        include: {
          line_items: { orderBy: { sort_order: 'asc' } },
          _count: { select: { payments: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.manual_invoices.count({ where }),
    ]);

    return NextResponse.json({ invoices, total, page, pages: Math.ceil(total / limit) });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const {
      customer_name, customer_phone, customer_email, customer_address,
      property_address, notes, payment_terms, due_at, line_items,
    } = await req.json();

    if (!customer_name) {
      return NextResponse.json({ error: 'customer_name is required' }, { status: 400 });
    }
    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 });
    }

    // Generate invoice number
    const count = await prisma.manual_invoices.count();
    const invoice_no = `MI-${String(count + 1).padStart(5, '0')}`;

    const amount_due = line_items.reduce((sum: number, item: any) => sum + (item.amount || item.qty * item.unit_price || 0), 0);

    const invoice = await prisma.manual_invoices.create({
      data: {
        invoice_no,
        customer_name,
        customer_phone: customer_phone || null,
        customer_email: customer_email || null,
        customer_address: customer_address || null,
        property_address: property_address || null,
        notes: notes || null,
        payment_terms: payment_terms || undefined,
        amount_due,
        due_at: due_at ? new Date(due_at) : null,
        line_items: {
          create: line_items.map((item: any, idx: number) => ({
            description: item.description,
            qty: item.qty || 1,
            unit: item.unit || null,
            unit_price: item.unit_price || 0,
            amount: item.amount || (item.qty || 1) * (item.unit_price || 0),
            sort_order: idx,
          })),
        },
      },
      include: {
        line_items: { orderBy: { sort_order: 'asc' } },
      },
    });

    return NextResponse.json({ invoice });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
