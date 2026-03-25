/**
 * Paloma Home Services — Branded Email Wrapper
 * Provides consistent header/footer for all outbound emails.
 */

const BRAND_COLOR = '#2563eb';
const LOGO_URL    = 'https://palomahomeservices.com/logo.png';
const PHONE       = '940-241-8244';
const WEBSITE     = 'palomahomeservices.com';
const ADMIN_URL   = 'https://admin.palomahomeservices.com';

export interface BrandedEmailOpts {
  /** Main body HTML */
  body: string;
  /** Optional preview / preheader text */
  preheader?: string;
}

export function brandedWrapper(opts: BrandedEmailOpts): string {
  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${opts.preheader}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Paloma Home Services</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5">
    <tr>
      <td align="center" style="padding:24px 16px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

          <!-- HEADER -->
          <tr>
            <td style="background:${BRAND_COLOR};border-radius:12px 12px 0 0;padding:32px 24px;text-align:center">
              <img src="${LOGO_URL}" alt="Paloma Home Services" width="160" style="max-width:160px;height:auto;margin-bottom:12px" />
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px">Paloma Home Services</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px">Your Neighborhood Handyman &middot; Little Elm, TX</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:32px 24px">
              ${opts.body}
            </td>
          </tr>

          <!-- SIGNATURE -->
          <tr>
            <td style="background:#ffffff;padding:0 24px 32px;border-top:1px solid #e4e4e7">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-top:20px">
                    <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#18181b">Paloma Home Services</p>
                    <p style="margin:0 0 2px;font-size:13px;color:#71717a">
                      <a href="tel:${PHONE.replace(/[^0-9]/g, '')}" style="color:${BRAND_COLOR};text-decoration:none">${PHONE}</a>
                    </p>
                    <p style="margin:0;font-size:13px;color:#71717a">
                      <a href="https://${WEBSITE}" style="color:${BRAND_COLOR};text-decoration:none">${WEBSITE}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#18181b;border-radius:0 0 12px 12px;padding:20px 24px;text-align:center">
              <p style="margin:0;font-size:12px;color:#a1a1aa">
                You received this email from Paloma Home Services
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#71717a">
                <a href="https://${WEBSITE}" style="color:#a1a1aa;text-decoration:underline">${WEBSITE}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export { BRAND_COLOR, LOGO_URL, PHONE, WEBSITE, ADMIN_URL };
