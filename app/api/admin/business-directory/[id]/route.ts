import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const body = await req.json();
    const allowed = ['status', 'notes', 'last_contacted_at'];
    const data: any = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === 'last_contacted_at' && body[key]) {
          data[key] = new Date(body[key]);
        } else {
          data[key] = body[key];
        }
      }
    }

    const business = await prisma.business_directory.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ business });
  } catch (error: any) {
    if (error.message === 'Unauthorized')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
