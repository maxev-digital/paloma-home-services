import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import path from 'path';
// @ts-ignore
import PDFDocument from 'pdfkit';

const LOGO_PATH = path.join(process.cwd(), 'public', 'images', 'logo.png');

const BLUE  = '#2563eb';
const DARK  = '#111827';
const GRAY  = '#6b7280';
const BLACK = '#1f2937';

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Draw a faint centered watermark logo on the current page
function drawWatermark(doc: any) {
  const PW = 612; // LETTER width in points
  const PH = 792; // LETTER height in points
  const WM = 280; // watermark size
  const wx = (PW - WM) / 2;
  const wy = (PH - WM) / 2 + 20; // slightly below true center to clear header
  try {
    doc.save();
    doc.opacity(0.06);
    doc.image(LOGO_PATH, wx, wy, { width: WM, height: WM });
    doc.restore();
  } catch (_) { /* skip if logo missing */ }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();

    const estimate = await prisma.estimates.findUnique({
      where: { id: params.id },
      include: {
        customer:   true,
        line_items: { orderBy: { category: 'asc' } },
      },
    });

    if (!estimate) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const cust = estimate.customer;

    // Group line items by category
    const groups = new Map<string, typeof estimate.line_items>();
    for (const li of estimate.line_items) {
      if (!groups.has(li.category)) groups.set(li.category, []);
      groups.get(li.category)!.push(li);
    }

    // Build PDF
    const chunks: Buffer[] = [];
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    await new Promise<void>((resolve) => {
      doc.on('end', resolve);

      const L = 50;
      const R = 562;
      const W = R - L;

      // ── Watermark (drawn first, behind everything) ───────────────────────
      drawWatermark(doc);

      // ── Header bar ──────────────────────────────────────────────────────
      doc.rect(0, 0, 612, 90).fill(BLUE);

      // Logo (square 1600x1600 → 62x62 at header height)
      try { doc.image(LOGO_PATH, 10, 14, { width: 62, height: 62 }); } catch (_) { /* skip */ }

      // Company text — capped at x=415 to avoid right accent overlap
      const TX = 84;
      const TEXT_MAX_W = 330; // 84 to 414
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(14)
        .text('PALOMA HOME SERVICES', TX, 18, { width: TEXT_MAX_W });
      doc.font('Helvetica').fontSize(7.5).fillColor('#bfdbfe')
        .text('Handyman & Home Services  ·  Little Elm & DFW', TX, 38, { width: TEXT_MAX_W })
        .text('(214) 795-3905  ·  info@palomahomeservices.com', TX, 50, { width: TEXT_MAX_W })
        .text('palomahomeservices.com', TX, 62, { width: TEXT_MAX_W });

      // Darker right accent block
      const RX = 418;
      doc.rect(RX, 0, 612 - RX, 90).fill('#1d4ed8');
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#fff')
        .text('ESTIMATE', RX + 6, 18, { width: 612 - RX - 10, align: 'right' });
      doc.font('Helvetica').fontSize(8).fillColor('#bfdbfe')
        .text(
          new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          RX + 6, 50, { width: 612 - RX - 10, align: 'right' }
        );

      // Bottom accent line
      doc.rect(0, 88, 612, 2).fill('#1e3a5f');

      // ── Customer / Project meta ──────────────────────────────────────────
      let y = 108;

      doc.font('Helvetica-Bold').fontSize(8).fillColor(GRAY)
        .text('PREPARED FOR', L, y)
        .text('PROJECT DETAILS', 330, y);
      y += 13;

      const metaTop = y;

      // Left column — sequential y so wrapped lines never collide
      const LCW = 260;
      let leftY = metaTop;

      doc.font('Helvetica-Bold').fontSize(10).fillColor(BLACK)
        .text(cust.name, L, leftY, { width: LCW });
      leftY += doc.heightOfString(cust.name, { width: LCW }) + 3;

      doc.font('Helvetica').fontSize(9).fillColor(DARK);
      if (cust.address) {
        doc.text(cust.address, L, leftY, { width: LCW });
        leftY += doc.heightOfString(cust.address, { width: LCW }) + 3;
      }
      doc.text(cust.phone, L, leftY, { width: LCW });
      leftY += 13;
      if (cust.email) {
        doc.text(cust.email, L, leftY, { width: LCW });
        leftY += 13;
      }

      // Right column — sequential y using heightOfString so rows never collide
      const dFmt = (d: Date | string | null) =>
        d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '--';

      const LBEL_X = 330; const LBEL_W = 80;
      const VAL_X  = 410; const VAL_W  = 152;

      const details: [string, string][] = [
        ['Property', estimate.address || '--'],
        ['Date',     dFmt(estimate.created_at)],
        ['Status',   estimate.status],
      ];

      let rightY = metaTop;
      details.forEach(([label, val]) => {
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(GRAY)
          .text(label, LBEL_X, rightY, { width: LBEL_W });
        doc.font('Helvetica').fontSize(8.5).fillColor(BLACK)
          .text(val, VAL_X, rightY, { width: VAL_W, align: 'right' });
        const lh = doc.heightOfString(label, { width: LBEL_W, fontSize: 8.5 });
        const vh = doc.heightOfString(val,   { width: VAL_W,  fontSize: 8.5 });
        rightY += Math.max(lh, vh) + 5;
      });

      y = Math.max(leftY, rightY) + 8;
      doc.rect(L - 4, y, W + 8, 1).fill('#e5e7eb');
      y += 12;

      // ── Line Items table ─────────────────────────────────────────────────
      // Columns: item 50–315 | qty 315–360 | unit 360–400 | rate 400–475 | total 475–562
      const COL = { item: L, itemW: 265, qty: 315, qtyW: 42, unit: 358, unitW: 40, rate: 400, rateW: 62, totalX: 497, totalW: 65 };

      doc.rect(L - 4, y, W + 8, 18).fill('#f3f4f6');
      doc.font('Helvetica-Bold').fontSize(8).fillColor(GRAY);
      doc.text('ITEM DESCRIPTION', COL.item, y + 5, { width: COL.itemW });
      doc.text('QTY',   COL.qty,    y + 5, { width: COL.qtyW,   align: 'right' });
      doc.text('UNIT',  COL.unit,   y + 5, { width: COL.unitW,  align: 'right' });
      doc.text('RATE',  COL.rate,   y + 5, { width: COL.rateW,  align: 'right' });
      doc.text('TOTAL', COL.totalX, y + 5, { width: COL.totalW, align: 'right' });
      y += 22;

      Array.from(groups.entries()).forEach(([cat, items]) => {
        if (y > 680) {
          doc.addPage();
          drawWatermark(doc);
          y = 50;
        }
        doc.font('Helvetica-Bold').fontSize(8).fillColor(BLUE)
          .text(cat.toUpperCase(), COL.item, y, { width: W });
        y += 12;

        items.forEach((li: any) => {
          if (y > 680) {
            doc.addPage();
            drawWatermark(doc);
            y = 50;
          }

          doc.font('Helvetica').fontSize(8).fillColor(BLACK)
            .text(li.label, COL.item, y, { width: COL.itemW });
          doc.text(
            li.qty % 1 === 0 ? String(li.qty) : li.qty.toFixed(2),
            COL.qty, y, { width: COL.qtyW, align: 'right' }
          );
          doc.text(li.unit,          COL.unit,   y, { width: COL.unitW,  align: 'right' });
          doc.fillColor(GRAY)
            .text(fmt(li.rate),      COL.rate,   y, { width: COL.rateW,  align: 'right' });
          doc.fillColor(BLACK)
            .text(fmt(li.line_total), COL.totalX, y, { width: COL.totalW, align: 'right' });
          y += 14;

          doc.rect(COL.item - 4, y - 2, W + 8, 0.5).fill('#f3f4f6');
        });
        y += 4;
      });

      // ── Totals ───────────────────────────────────────────────────────────
      y += 8;
      doc.rect(L - 4, y, W + 8, 1).fill('#d1d5db');
      y += 12;

      if (y > 680) { doc.addPage(); drawWatermark(doc); y = 50; }
      doc.rect(350, y, 212, 32).fill(BLUE);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#fff')
        .text('ESTIMATE TOTAL', 356, y + 10, { width: 90 })
        .text(fmt(estimate.total), 356, y + 10, { width: 200, align: 'right' });
      y += 50;

      // ── Notes ────────────────────────────────────────────────────────────
      if (estimate.notes) {
        if (y > 650) { doc.addPage(); drawWatermark(doc); y = 50; }
        doc.font('Helvetica-Bold').fontSize(8.5).fillColor(GRAY).text('NOTES', L, y);
        y += 14;
        doc.font('Helvetica').fontSize(8).fillColor(BLACK).text(estimate.notes, L, y, { width: W });
        y += doc.heightOfString(estimate.notes, { width: W }) + 12;
      }

      // ── Disclaimer ───────────────────────────────────────────────────────
      if (y > 690) { doc.addPage(); drawWatermark(doc); y = 50; }
      doc.font('Helvetica').fontSize(7.5).fillColor(GRAY)
        .text(
          'This estimate is based on the scope of work described above. Final pricing may vary upon on-site inspection. ' +
          'All prices include labor and materials unless otherwise noted. Valid for 30 days.',
          L, y, { width: W }
        );
      y += 26;
      doc.font('Helvetica-Bold').fontSize(9).fillColor(BLUE)
        .text('Thank you for choosing Paloma Home Services!', L, y, { width: W, align: 'center' });

      // ── Footer ───────────────────────────────────────────────────────────
      doc.font('Helvetica').fontSize(7).fillColor(GRAY)
        .text(
          'Paloma Home Services  ·  (214) 795-3905  ·  info@palomahomeservices.com  ·  palomahomeservices.com',
          L, 740, { width: W, align: 'center' }
        );

      doc.end();
    });

    const pdfBuffer = Buffer.concat(chunks);
    const filename  = 'estimate-' + estimate.id.slice(-8) + '.pdf';

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': 'inline; filename="' + filename + '"',
        'Content-Length':      String(pdfBuffer.length),
        'Cache-Control':       'no-store',
      },
    });

  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[estimate/pdf]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
