import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { brandedWrapper } from '@/lib/email/brandedWrapper';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const { business_ids, template_id, mailbox = 1 } = await req.json();

    if (!business_ids || !Array.isArray(business_ids) || business_ids.length === 0) {
      return NextResponse.json({ error: 'business_ids array is required' }, { status: 400 });
    }
    if (!template_id) {
      return NextResponse.json({ error: 'template_id is required' }, { status: 400 });
    }

    // Fetch template
    const template = await prisma.outreach_templates.findUnique({ where: { id: template_id } });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Fetch businesses
    const businesses = await prisma.business_directory.findMany({
      where: { id: { in: business_ids } },
    });

    // Setup SMTP transport
    const email = process.env[`OUTREACH_MAILBOX_${mailbox}_EMAIL`];
    const pass = process.env[`OUTREACH_MAILBOX_${mailbox}_PASS`];

    if (!email || !pass) {
      return NextResponse.json(
        { error: `Mailbox ${mailbox} is not configured. Set OUTREACH_MAILBOX_${mailbox}_EMAIL and OUTREACH_MAILBOX_${mailbox}_PASS in .env` },
        { status: 400 },
      );
    }

    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: { user: email, pass },
      tls: { rejectUnauthorized: true },
    });

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const results: Array<{ id: string; name: string; email: string | null; status: string; error?: string }> = [];

    for (const biz of businesses) {
      // Skip businesses without email
      if (!biz.email) {
        skipped++;
        results.push({ id: biz.id, name: biz.name, email: null, status: 'skipped' });
        continue;
      }

      try {
        // Substitute template variables
        const vars: Record<string, string> = {
          name: biz.name || '',
          address: biz.address || '',
          city: biz.city || '',
          phone: biz.phone || '',
          category: biz.category || '',
          website: biz.website || '',
        };

        let subject = template.subject;
        let body = template.body;
        for (const [key, value] of Object.entries(vars)) {
          const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
          subject = subject.replace(pattern, value);
          body = body.replace(pattern, value);
        }

        // Wrap in branded email
        const html = brandedWrapper({ body });

        // Send email
        await transport.sendMail({
          from: `"Paloma Home Services" <${email}>`,
          to: biz.email,
          subject,
          html,
          headers: {
            'X-Mailer': 'Paloma Home Services',
            'List-Unsubscribe': '<https://palomahomeservices.com/unsubscribe>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });

        // Update business status
        await prisma.business_directory.update({
          where: { id: biz.id },
          data: {
            status: 'CONTACTED',
            last_contacted_at: new Date(),
          },
        });

        sent++;
        results.push({ id: biz.id, name: biz.name, email: biz.email, status: 'sent' });
      } catch (err: any) {
        failed++;
        results.push({ id: biz.id, name: biz.name, email: biz.email, status: 'failed', error: err.message });
      }
    }

    return NextResponse.json({ sent, failed, skipped, total: businesses.length, results });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
