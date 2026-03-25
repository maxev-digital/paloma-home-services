/**
 * Paloma Home Services — Admin & Customer Notification Helpers
 */
import { sendEmail } from '@/lib/notify-email';
import { brandedWrapper, BRAND_COLOR, ADMIN_URL, PHONE, WEBSITE, LOGO_URL } from '@/lib/email/brandedWrapper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EstimateLineItem {
  label: string;
  category: string;
  qty: number;
  unit: string;
  rate: number;
  lineTotal: number;
}

export interface EstimatePropertyDetails {
  lotSize?: string;
  stories?: string;
  propertyType?: string;
  urgency?: string;
  photoCount?: number;
  referralSource?: string;
}

export interface NotifyNewEstimateOpts {
  estimateId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: string;
  total: number;
  costTotal: number;
  lineItems: EstimateLineItem[];
  propertyDetails?: EstimatePropertyDetails;
}

export interface NotifyEstimateCustomerOpts {
  estimateId: string;
  customerName: string;
  customerEmail: string;
  address: string;
  total: number;
  costTotal: number;
  lineItems: EstimateLineItem[];
  propertyDetails?: EstimatePropertyDetails;
}

export interface NotifyNewContactOpts {
  name: string;
  phone: string;
  email?: string;
  message: string;
  source?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.OUTREACH_MAILBOX_1_EMAIL || '';

function lineItemRows(items: EstimateLineItem[]): string {
  return items
    .map(
      (li) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #333;font-size:13px;color:#e4e4e7">${li.label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #333;font-size:13px;color:#e4e4e7;text-align:center">${li.qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #333;font-size:13px;color:#e4e4e7;text-align:center">${li.unit}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #333;font-size:13px;color:#e4e4e7;text-align:right">${fmt(li.rate)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #333;font-size:13px;color:#e4e4e7;text-align:right">${fmt(li.lineTotal)}</td>
      </tr>`
    )
    .join('');
}

function lineItemRowsLight(items: EstimateLineItem[]): string {
  return items
    .map(
      (li) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-size:13px;color:#3f3f46">${li.label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-size:13px;color:#3f3f46;text-align:center">${li.qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-size:13px;color:#3f3f46;text-align:center">${li.unit}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-size:13px;color:#3f3f46;text-align:right">${fmt(li.rate)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e4e4e7;font-size:13px;color:#3f3f46;text-align:right">${fmt(li.lineTotal)}</td>
      </tr>`
    )
    .join('');
}

function propertyDetailRowsDark(details?: EstimatePropertyDetails): string {
  if (!details) return '';
  const rows: string[] = [];
  if (details.lotSize) rows.push(`<tr><td style="padding-bottom:4px;font-size:13px;color:#a1a1aa">Lot Size</td><td style="padding-bottom:4px;font-size:14px;color:#fafafa;text-align:right">${details.lotSize}</td></tr>`);
  if (details.stories) rows.push(`<tr><td style="padding-bottom:4px;font-size:13px;color:#a1a1aa">Stories</td><td style="padding-bottom:4px;font-size:14px;color:#fafafa;text-align:right">${details.stories}</td></tr>`);
  if (details.propertyType) rows.push(`<tr><td style="padding-bottom:4px;font-size:13px;color:#a1a1aa">Property Type</td><td style="padding-bottom:4px;font-size:14px;color:#fafafa;text-align:right">${details.propertyType}</td></tr>`);
  if (details.urgency) rows.push(`<tr><td style="padding-bottom:4px;font-size:13px;color:#a1a1aa">Urgency</td><td style="padding-bottom:4px;font-size:14px;color:#fafafa;text-align:right">${details.urgency}</td></tr>`);
  if (details.photoCount && details.photoCount > 0) rows.push(`<tr><td style="padding-bottom:4px;font-size:13px;color:#a1a1aa">Photos</td><td style="padding-bottom:4px;font-size:14px;color:#fafafa;text-align:right">${details.photoCount} attached</td></tr>`);
  if (details.referralSource) rows.push(`<tr><td style="padding-bottom:4px;font-size:13px;color:#a1a1aa">Referral Source</td><td style="padding-bottom:4px;font-size:14px;color:#fafafa;text-align:right">${details.referralSource}</td></tr>`);
  return rows.join('');
}

function propertyDetailRowsLight(details?: EstimatePropertyDetails): string {
  if (!details) return '';
  const rows: string[] = [];
  if (details.lotSize) rows.push(`<li>Lot Size: ${details.lotSize}</li>`);
  if (details.stories) rows.push(`<li>Stories: ${details.stories}</li>`);
  if (details.propertyType) rows.push(`<li>Property Type: ${details.propertyType}</li>`);
  if (details.urgency) rows.push(`<li>Urgency: ${details.urgency}</li>`);
  if (rows.length === 0) return '';
  return `<ul style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#3f3f46;line-height:1.8">${rows.join('')}</ul>`;
}

function groupByCategory(items: EstimateLineItem[]): Record<string, EstimateLineItem[]> {
  const groups: Record<string, EstimateLineItem[]> = {};
  for (const item of items) {
    const cat = item.category || 'General';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// 1. Admin notification — new estimate submitted
// ---------------------------------------------------------------------------

export async function notifyNewEstimate(opts: NotifyNewEstimateOpts): Promise<void> {
  if (!ADMIN_EMAIL) {
    console.warn('[notify] No admin email configured — skipping notifyNewEstimate');
    return;
  }

  const margin = opts.total - opts.costTotal;

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#09090b">
    <tr>
      <td align="center" style="padding:24px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};border-radius:12px 12px 0 0;padding:24px;text-align:center">
              <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700">New Estimate Submitted</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Paloma Home Services Admin</p>
            </td>
          </tr>

          <!-- Customer Info -->
          <tr>
            <td style="background:#18181b;padding:24px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:4px;font-size:13px;color:#a1a1aa">Customer</td>
                  <td style="padding-bottom:4px;font-size:14px;color:#fafafa;text-align:right;font-weight:600">${opts.customerName}</td>
                </tr>
                <tr>
                  <td style="padding-bottom:4px;font-size:13px;color:#a1a1aa">Phone</td>
                  <td style="padding-bottom:4px;font-size:14px;color:#fafafa;text-align:right">${opts.customerPhone}</td>
                </tr>
                ${opts.customerEmail ? `<tr>
                  <td style="padding-bottom:4px;font-size:13px;color:#a1a1aa">Email</td>
                  <td style="padding-bottom:4px;font-size:14px;color:#fafafa;text-align:right">${opts.customerEmail}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding-bottom:4px;font-size:13px;color:#a1a1aa">Address</td>
                  <td style="padding-bottom:4px;font-size:14px;color:#fafafa;text-align:right">${opts.address}</td>
                </tr>
                ${propertyDetailRowsDark(opts.propertyDetails)}
              </table>
            </td>
          </tr>

          <!-- Line Items -->
          <tr>
            <td style="background:#18181b;padding:0 24px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #333;border-radius:8px;overflow:hidden">
                <tr style="background:#27272a">
                  <th style="padding:10px 12px;font-size:12px;color:#a1a1aa;text-align:left;font-weight:600">Item</th>
                  <th style="padding:10px 12px;font-size:12px;color:#a1a1aa;text-align:center;font-weight:600">Qty</th>
                  <th style="padding:10px 12px;font-size:12px;color:#a1a1aa;text-align:center;font-weight:600">Unit</th>
                  <th style="padding:10px 12px;font-size:12px;color:#a1a1aa;text-align:right;font-weight:600">Rate</th>
                  <th style="padding:10px 12px;font-size:12px;color:#a1a1aa;text-align:right;font-weight:600">Total</th>
                </tr>
                ${lineItemRows(opts.lineItems)}
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="background:#18181b;padding:20px 24px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#a1a1aa">Total</td>
                  <td style="padding:6px 0;font-size:16px;color:#fafafa;text-align:right;font-weight:700">${fmt(opts.total)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#a1a1aa">Cost</td>
                  <td style="padding:6px 0;font-size:16px;color:#fafafa;text-align:right;font-weight:700">${fmt(opts.costTotal)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:14px;color:#a1a1aa">Margin</td>
                  <td style="padding:6px 0;font-size:16px;color:#22c55e;text-align:right;font-weight:700">${fmt(margin)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#18181b;padding:0 24px 24px;text-align:center">
              <a href="${ADMIN_URL}/estimates/${opts.estimateId}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">
                View in Admin Panel
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#09090b;border-radius:0 0 12px 12px;padding:16px 24px;text-align:center">
              <p style="margin:0;font-size:12px;color:#52525b">Paloma Home Services Admin Notification</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Estimate: ${opts.customerName} — ${fmt(opts.total)}`,
    html,
  });
}

// ---------------------------------------------------------------------------
// 2. Customer confirmation — estimate submitted
// ---------------------------------------------------------------------------

export async function notifyEstimateCustomer(opts: NotifyEstimateCustomerOpts): Promise<void> {
  const margin = opts.total - opts.costTotal;

  const grouped = groupByCategory(opts.lineItems);
  let categoryBlocks = '';
  for (const [category, items] of Object.entries(grouped)) {
    categoryBlocks += `
      <tr>
        <td colspan="5" style="padding:12px 12px 6px;font-size:13px;font-weight:700;color:${BRAND_COLOR};text-transform:uppercase;letter-spacing:0.5px">${category}</td>
      </tr>
      ${lineItemRowsLight(items)}`;
  }

  const body = `
    <div style="text-align:center;margin-bottom:24px">
      <h2 style="margin:0 0 8px;font-size:20px;color:#18181b">Your Estimate</h2>
      <p style="margin:0;font-size:14px;color:#71717a">${opts.address}</p>
    </div>

    <p style="font-size:14px;color:#3f3f46;line-height:1.6;margin:0 0 24px">
      Hi ${opts.customerName},<br/>
      Thank you for using our estimate tool! Here is a summary of your project estimate.
    </p>

    ${propertyDetailRowsLight(opts.propertyDetails)}

    <!-- Line Items Table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;margin-bottom:24px">
      <tr style="background:#f4f4f5">
        <th style="padding:10px 12px;font-size:12px;color:#71717a;text-align:left;font-weight:600">Item</th>
        <th style="padding:10px 12px;font-size:12px;color:#71717a;text-align:center;font-weight:600">Qty</th>
        <th style="padding:10px 12px;font-size:12px;color:#71717a;text-align:center;font-weight:600">Unit</th>
        <th style="padding:10px 12px;font-size:12px;color:#71717a;text-align:right;font-weight:600">Rate</th>
        <th style="padding:10px 12px;font-size:12px;color:#71717a;text-align:right;font-weight:600">Total</th>
      </tr>
      ${categoryBlocks}
    </table>

    <!-- Summary Boxes -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
      <tr>
        <td width="33%" style="padding:4px">
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;text-align:center">
            <p style="margin:0 0 4px;font-size:12px;color:#71717a;font-weight:600">Your Estimate</p>
            <p style="margin:0;font-size:20px;color:${BRAND_COLOR};font-weight:700">${fmt(opts.total)}</p>
          </div>
        </td>
        <td width="33%" style="padding:4px">
          <div style="background:#f4f4f5;border:1px solid #e4e4e7;border-radius:8px;padding:16px;text-align:center">
            <p style="margin:0 0 4px;font-size:12px;color:#71717a;font-weight:600">Estimated Cost</p>
            <p style="margin:0;font-size:20px;color:#18181b;font-weight:700">${fmt(opts.costTotal)}</p>
          </div>
        </td>
        <td width="33%" style="padding:4px">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center">
            <p style="margin:0 0 4px;font-size:12px;color:#71717a;font-weight:600">You Save</p>
            <p style="margin:0;font-size:20px;color:#16a34a;font-weight:700">${fmt(margin)}</p>
          </div>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:16px">
      <a href="tel:9402418244" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:14px 40px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none">
        Call ${PHONE}
      </a>
    </div>
    <p style="text-align:center;font-size:13px;color:#a1a1aa;margin:0">
      Questions? Call or text us anytime.
    </p>
  `;

  const html = brandedWrapper({
    body,
    preheader: `Your estimate for ${opts.address} — ${fmt(opts.total)}`,
  });

  await sendEmail({
    to: opts.customerEmail,
    subject: `Your Estimate from Paloma Home Services — ${fmt(opts.total)}`,
    html,
  });
}

// ---------------------------------------------------------------------------
// 3. Admin notification — new contact form submission
// ---------------------------------------------------------------------------

export async function notifyNewContact(opts: NotifyNewContactOpts): Promise<void> {
  if (!ADMIN_EMAIL) {
    console.warn('[notify] No admin email configured — skipping notifyNewContact');
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5">
    <tr>
      <td align="center" style="padding:24px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};border-radius:12px 12px 0 0;padding:24px;text-align:center">
              <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700">New Contact Form Submission</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Paloma Home Services</p>
            </td>
          </tr>

          <!-- Contact Details -->
          <tr>
            <td style="background:#ffffff;padding:24px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#71717a;width:100px">Name</td>
                  <td style="padding:8px 0;font-size:14px;color:#18181b;font-weight:600">${opts.name}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-size:13px;color:#71717a">Phone</td>
                  <td style="padding:8px 0;font-size:14px;color:#18181b">
                    <a href="tel:${opts.phone.replace(/[^0-9+]/g, '')}" style="color:${BRAND_COLOR};text-decoration:none">${opts.phone}</a>
                  </td>
                </tr>
                ${opts.email ? `<tr>
                  <td style="padding:8px 0;font-size:13px;color:#71717a">Email</td>
                  <td style="padding:8px 0;font-size:14px;color:#18181b">
                    <a href="mailto:${opts.email}" style="color:${BRAND_COLOR};text-decoration:none">${opts.email}</a>
                  </td>
                </tr>` : ''}
                ${opts.source ? `<tr>
                  <td style="padding:8px 0;font-size:13px;color:#71717a">Source</td>
                  <td style="padding:8px 0;font-size:14px;color:#18181b">${opts.source}</td>
                </tr>` : ''}
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="background:#ffffff;padding:0 24px 24px">
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px">
                <p style="margin:0 0 4px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase">Message</p>
                <p style="margin:0;font-size:14px;color:#18181b;line-height:1.6;white-space:pre-wrap">${opts.message}</p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#ffffff;padding:0 24px 24px;text-align:center">
              <a href="${ADMIN_URL}/customers" style="display:inline-block;background:${BRAND_COLOR};color:#fff;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none">
                View in Admin Panel
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#18181b;border-radius:0 0 12px 12px;padding:16px 24px;text-align:center">
              <p style="margin:0;font-size:12px;color:#a1a1aa">Paloma Home Services Admin Notification</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `New Contact: ${opts.name} — ${opts.phone}`,
    html,
  });
}
