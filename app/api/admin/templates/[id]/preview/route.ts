import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();

    const template = await prisma.outreach_templates.findUnique({ where: { id: params.id } });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const { variables } = await req.json();

    // Default sample variables
    const sampleVars: Record<string, string> = {
      name: 'John Smith',
      address: '123 Main St',
      city: 'Austin',
      neighborhood: 'Oak Hills',
      phone: '(512) 555-1234',
      email: 'john@example.com',
      company_name: 'Paloma Home Services',
      company_phone: '(512) 555-0000',
      ...(variables || {}),
    };

    let renderedSubject = template.subject;
    let renderedBody = template.body;

    for (const [key, value] of Object.entries(sampleVars)) {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      renderedSubject = renderedSubject.replace(pattern, value);
      renderedBody = renderedBody.replace(pattern, value);
    }

    return NextResponse.json({
      subject: renderedSubject,
      body: renderedBody,
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;}</style></head><body><h2>${renderedSubject}</h2><div>${renderedBody}</div></body></html>`,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
