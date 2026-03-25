import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();

    // Get scheduler config
    const config = await prisma.outreach_scheduler_config.findFirst();
    if (!config || config.is_paused) {
      return NextResponse.json({ message: 'Scheduler is paused', sent: 0 });
    }

    if (!config.template_slug) {
      return NextResponse.json({ message: 'No template configured', sent: 0 });
    }

    // Get the active template
    const template = await prisma.outreach_templates.findFirst({
      where: { slug: config.template_slug, is_active: true },
    });
    if (!template) {
      return NextResponse.json({ message: 'Template not found or inactive', sent: 0 });
    }

    // Find eligible prospects
    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - config.contact_cooldown_days);

    const prospects = await prisma.prospects.findMany({
      where: {
        status: { in: ['NEW', 'NO_RESPONSE'] },
        email: { not: null },
        OR: [
          { last_contacted_at: null },
          { last_contacted_at: { lt: cooldownDate } },
        ],
      },
      take: config.daily_cap,
      orderBy: { created_at: 'asc' },
    });

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const senderEmail = process.env.OUTREACH_FROM_EMAIL || 'noreply@palomahomeservices.com';

    for (const prospect of prospects) {
      if (!prospect.email) {
        skipped++;
        continue;
      }

      try {
        const vars: Record<string, string> = {
          name: prospect.name || 'Homeowner',
          address: prospect.address,
          city: prospect.city,
          neighborhood: prospect.neighborhood || '',
        };

        let subject = template.subject;
        let body = template.body;
        for (const [key, value] of Object.entries(vars)) {
          const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
          subject = subject.replace(pattern, value);
          body = body.replace(pattern, value);
        }

        // TODO: integrate actual email sending (e.g. SendGrid, Resend)
        // For now, record the outreach attempt
        await prisma.outreach_history.create({
          data: {
            prospect_id: prospect.id,
            template_id: template.id,
            from_email: senderEmail,
            subject,
            status: 'sent',
          },
        });

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

    const durationMs = Date.now() - startTime;

    // Record the run
    await prisma.outreach_runs.create({
      data: {
        sent_count: sent,
        failed_count: failed,
        skipped_count: skipped,
        duration_ms: durationMs,
        triggered_by: 'cron',
      },
    });

    // Update config stats
    await prisma.outreach_scheduler_config.update({
      where: { id: config.id },
      data: {
        last_run_at: new Date(),
        last_run_sent: sent,
        last_run_failed: failed,
        last_run_skipped: skipped,
        total_sent_alltime: { increment: sent },
      },
    });

    return NextResponse.json({
      sent,
      failed,
      skipped,
      duration_ms: durationMs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
