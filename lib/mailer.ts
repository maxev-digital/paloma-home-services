/**
 * Paloma Home Services — Hostinger SMTP Mailer
 * Supports up to 4 mailboxes. 500/day, 200/hour per mailbox.
 */
import nodemailer from 'nodemailer';
import { brand } from '@/lib/brand';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');

const MAILBOXES = [
  {
    email: process.env.OUTREACH_MAILBOX_1_EMAIL || '',
    pass:  process.env.OUTREACH_MAILBOX_1_PASS  || '',
    name:  process.env.OUTREACH_MAILBOX_1_NAME  || brand.name,
  },
  {
    email: process.env.OUTREACH_MAILBOX_2_EMAIL || '',
    pass:  process.env.OUTREACH_MAILBOX_2_PASS  || '',
    name:  process.env.OUTREACH_MAILBOX_2_NAME  || brand.name,
  },
  {
    email: process.env.OUTREACH_MAILBOX_3_EMAIL || '',
    pass:  process.env.OUTREACH_MAILBOX_3_PASS  || '',
    name:  process.env.OUTREACH_MAILBOX_3_NAME  || brand.name,
  },
  {
    email: process.env.OUTREACH_MAILBOX_4_EMAIL || '',
    pass:  process.env.OUTREACH_MAILBOX_4_PASS  || '',
    name:  process.env.OUTREACH_MAILBOX_4_NAME  || brand.name,
  },
].filter(m => m.email && m.pass);

function createTransport(mailbox: { email: string; pass: string }) {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: mailbox.email, pass: mailbox.pass },
    tls: { rejectUnauthorized: true },
  });
}

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  mailboxIndex?: number;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  fromEmail?: string;
  error?: string;
}

export async function sendEmail(opts: EmailOptions): Promise<SendResult> {
  if (MAILBOXES.length === 0) {
    return { success: false, error: 'No mailboxes configured. Set OUTREACH_MAILBOX_1_EMAIL/PASS in .env' };
  }

  let mailbox = MAILBOXES[0];
  if (opts.mailboxIndex !== undefined && opts.mailboxIndex >= 0 && opts.mailboxIndex < MAILBOXES.length) {
    mailbox = MAILBOXES[opts.mailboxIndex];
  }

  const transport = createTransport(mailbox);

  try {
    const info = await transport.sendMail({
      from: `"${mailbox.name}" <${mailbox.email}>`,
      to: opts.toName ? `"${opts.toName}" <${opts.to}>` : opts.to,
      replyTo: opts.replyTo || mailbox.email,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      headers: {
        'X-Mailer': brand.name,
        'List-Unsubscribe': `<${brand.website}/unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    return { success: true, messageId: info.messageId, fromEmail: mailbox.email };
  } catch (error: any) {
    return { success: false, fromEmail: mailbox.email, error: error.message };
  }
}

export async function sendTransactionalEmail(opts: EmailOptions): Promise<SendResult> {
  return sendEmail({ ...opts, mailboxIndex: 0 });
}

export function getConfiguredMailboxCount() {
  return MAILBOXES.length;
}
