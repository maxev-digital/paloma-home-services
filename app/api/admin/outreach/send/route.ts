import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { prospect_ids, template_id, from_email } = await req.json();

    if (!prospect_ids || !Array.isArray(prospect_ids) || prospect_ids.length === 0) {
      return NextResponse.json({ error: 'prospect_ids array is required' }, { status: 400 });
    }
    if (!template_id) {
      return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
    }

    const template = await prisma.outreach_templates.findUnique({ where: { id: template_id } });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const prospects = await prisma.prospects.findMany({
      where: { id: { in: prospect_ids }, email: { not: null } },
    });

    const senderEmail = from_email || process.env.OUTREACH_FROM_EMAIL || 'noreply@palomahomeservices.com';

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const prospect of prospects) {
      try {
        // Render template
        const vars: Record<string, string> = {
          name: prospect.name || 'Homeowner',
          address: prospect.address,
          city: prospect.city,
          neighborhood: prospect.neighborhood || '',
          phone: prospect.phone || '',
          email: prospect.email || '',
        };

        let subject = template.subject;
        let body = template.body;
        for (const [key, value] of Object.entries(vars)) {
          const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
          subject = subject.replace(pattern, value);
          body = body.replace(pattern, value);
        }

        // Record outreach attempt
        await prisma.outreach_history.create({
          data: {
            prospect_id: prospect.id,
            template_id: template.id,
            from_email: senderEmail,
            subject,
            status: 'sent',
          },
        });

        // Update prospect
        await prisma.prospects.update({
          where: { id: prospect.id },
          data: {
            status: 'CONTACTED',
            last_contacted_at: new Date(),
          },
        });

        sent++;
      } catch (err: any) {
        failed++;
        errors.push(`${prospect.email}: ${err.message}`);

        await prisma.outreach_history.create({
          data: {
            prospect_id: prospect.id,
            template_id: template.id,
            from_email: senderEmail,
            subject: template.subject,
            status: 'failed',
            error_msg: err.message,
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      sent,
      failed,
      total: prospects.length,
      skipped_no_email: prospect_ids.length - prospects.length,
      errors: errors.slice(0, 20),
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
