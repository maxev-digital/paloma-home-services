/**
 * PUBLIC contact form endpoint (no auth).
 * POST /api/contact
 *
 * Creates/updates customer, appends note, sends admin notification.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyNewContact } from '@/lib/notify';

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9+]/g, '');
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email, message, source } = await req.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'name and phone are required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const normalizedPhone = normalizePhone(phone);

    // --- Find or create customer by phone -----------------------------------
    let customer = await prisma.customers.findFirst({ where: { phone: normalizedPhone } });

    const timestamp = new Date().toISOString();
    const noteEntry = `[${timestamp}] Contact form${source ? ` (${source})` : ''}: ${message}`;

    if (!customer) {
      customer = await prisma.customers.create({
        data: {
          name,
          phone: normalizedPhone,
          email: email || null,
          notes: noteEntry,
        },
      });
    } else {
      // Append note to existing customer
      const existingNotes = customer.notes || '';
      const updatedNotes = existingNotes
        ? `${existingNotes}\n${noteEntry}`
        : noteEntry;

      const updates: any = { notes: updatedNotes };
      if (!customer.email && email) updates.email = email;

      await prisma.customers.update({
        where: { id: customer.id },
        data: updates,
      });
    }

    // --- Non-blocking admin notification ------------------------------------
    notifyNewContact({
      name,
      phone: normalizedPhone,
      email: email || undefined,
      message,
      source: source || undefined,
    }).catch((err) => console.error('[notify] notifyNewContact failed:', err));

    // --- Response -----------------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        message: 'Contact form submitted successfully',
      },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (error: any) {
    console.error('[api/contact] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
