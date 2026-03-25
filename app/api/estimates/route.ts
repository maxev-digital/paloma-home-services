/**
 * PUBLIC estimate submission endpoint (no auth).
 * POST /api/estimates
 *
 * Accepts estimates from the customer-facing estimate tool,
 * creates customer + estimate + prospect records, and fires
 * non-blocking email notifications.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyNewEstimate, notifyEstimateCustomer } from '@/lib/notify';

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
// Types
// ---------------------------------------------------------------------------

interface IncomingLineItem {
  id: string;
  label: string;
  category: string;
  unit: string;
  qty: number;
  rate: number;
  cost: number;
  lineTotal: number;
  lineCost: number;
}

interface IncomingBody {
  contact: { name: string; phone: string; email?: string; referralSource?: string };
  project: {
    address: string;
    serviceType?: string;
    notes?: string;
    lotSize?: string;
    stories?: string | number;
    propertyType?: string;
    urgency?: string;
  };
  photos?: string[];
  lineItems: IncomingLineItem[];
  totals?: { total?: number; costTotal?: number };
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
    const body: IncomingBody = await req.json();

    // --- Validate -----------------------------------------------------------
    const { contact, project, lineItems, photos } = body;
    if (!contact?.name || !contact?.phone) {
      return NextResponse.json(
        { error: 'contact.name and contact.phone are required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    if (!project?.address) {
      return NextResponse.json(
        { error: 'project.address is required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json(
        { error: 'At least one line item is required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // --- Normalize line items & compute totals ------------------------------
    console.log('[api/estimates] Raw lineItems[0]:', JSON.stringify(lineItems[0]));
    const normalizedItems = lineItems.map((li: any) => {
      const qty = Number(li.qty) || 1;
      const rate = Number(li.rate) || 0;
      const cost = Number(li.cost) || 0;
      const id = li.id || li.itemId || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      return {
        id,
        label: li.label || 'Unknown Item',
        category: li.category || 'General',
        unit: li.unit || 'ea',
        qty,
        rate,
        cost,
        lineTotal: Number(li.lineTotal) || qty * rate,
        lineCost: Number(li.lineCost) || qty * cost,
      };
    });

    // --- Build enhanced notes with property details --------------------------
    const photoCount = Array.isArray(photos) ? photos.length : 0;
    const propertyDetails: string[] = [];
    if (project.lotSize) propertyDetails.push(`Lot Size: ${project.lotSize}`);
    if (project.stories) propertyDetails.push(`Stories: ${project.stories}`);
    if (project.propertyType) propertyDetails.push(`Property Type: ${project.propertyType}`);
    if (project.urgency) propertyDetails.push(`Urgency: ${project.urgency}`);
    if (photoCount > 0) propertyDetails.push(`Photos: ${photoCount} attached`);
    if (contact.referralSource) propertyDetails.push(`Referral Source: ${contact.referralSource}`);

    const notesLines: string[] = [];
    if (project.notes) notesLines.push(project.notes);
    if (propertyDetails.length > 0) {
      notesLines.push('--- Property Details ---');
      notesLines.push(propertyDetails.join('\n'));
    }
    const combinedNotes = notesLines.length > 0 ? notesLines.join('\n') : null;

    const total =
      body.totals?.total ??
      normalizedItems.reduce((sum, li) => sum + li.lineTotal, 0);
    const costTotal =
      body.totals?.costTotal ??
      normalizedItems.reduce((sum, li) => sum + li.lineCost, 0);

    // --- Upsert unknown IDs into line_item_master (never overwrite) ---------
    const masterIds = normalizedItems.map((li) => li.id).filter(Boolean);
    if (masterIds.length > 0) {
      const existing = await prisma.line_item_master.findMany({
        where: { id: { in: masterIds } },
        select: { id: true },
      });
      const existingSet = new Set(existing.map((e) => e.id));
      const toCreate = normalizedItems.filter((li) => li.id && !existingSet.has(li.id));

      if (toCreate.length > 0) {
        await prisma.line_item_master.createMany({
          data: toCreate.map((li) => ({
            id: li.id,
            label: li.label,
            unit: li.unit,
            rate: li.rate,
            cost: li.cost,
            category: li.category,
            sort_order: 0,
          })),
          skipDuplicates: true,
        });
      }
    }

    // --- Find or create customer by phone -----------------------------------
    const phone = normalizePhone(contact.phone);
    let customer = await prisma.customers.findFirst({ where: { phone } });

    if (!customer) {
      customer = await prisma.customers.create({
        data: {
          name: contact.name,
          phone,
          email: contact.email || null,
          address: project.address,
        },
      });
    } else {
      // Update email/address if not already set
      const updates: any = {};
      if (!customer.email && contact.email) updates.email = contact.email;
      if (!customer.address && project.address) updates.address = project.address;
      if (Object.keys(updates).length > 0) {
        await prisma.customers.update({ where: { id: customer.id }, data: updates });
      }
    }

    // --- Create estimate with line items ------------------------------------
    const margin = total - costTotal;
    const marginPct = total > 0 ? (margin / total) * 100 : 0;

    const estimate = await prisma.estimates.create({
      data: {
        customer_id: customer.id,
        address: project.address,
        notes: combinedNotes,
        total,
        cost_total: costTotal,
        margin,
        margin_pct: marginPct,
        status: 'DRAFT',
        line_items: {
          create: normalizedItems.map((li) => ({
            line_item_id: li.id,
            label: li.label,
            category: li.category,
            unit: li.unit,
            qty: li.qty,
            rate: li.rate,
            cost: li.cost,
            line_total: li.lineTotal,
            line_cost: li.lineCost,
          })),
        },
      },
    });

    // --- Auto-create prospect -----------------------------------------------
    try {
      const existingProspect = await prisma.prospects.findFirst({ where: { phone } });
      if (!existingProspect) {
        await prisma.prospects.create({
          data: {
            name: contact.name,
            phone,
            email: contact.email || null,
            address: project.address,
            city: 'DFW',
            source: contact.referralSource || 'estimate_tool',
            status: 'INTERESTED',
          },
        });
      }
    } catch (e) {
      console.warn('[api/estimates] Failed to create prospect:', e);
    }

    // --- Non-blocking notifications -----------------------------------------
    const emailLineItems = normalizedItems.map((li) => ({
      label: li.label,
      category: li.category,
      qty: li.qty,
      unit: li.unit,
      rate: li.rate,
      lineTotal: li.lineTotal,
    }));

    const propertyDetailsForEmail = {
      lotSize: project.lotSize,
      stories: project.stories ? String(project.stories) : undefined,
      propertyType: project.propertyType,
      urgency: project.urgency,
      photoCount,
      referralSource: contact.referralSource,
    };

    // Admin notification
    notifyNewEstimate({
      estimateId: estimate.id,
      customerName: contact.name,
      customerPhone: phone,
      customerEmail: contact.email,
      address: project.address,
      total,
      costTotal,
      lineItems: emailLineItems,
      propertyDetails: propertyDetailsForEmail,
    }).catch((err) => console.error('[notify] notifyNewEstimate failed:', err));

    // Customer confirmation email (if email provided)
    if (contact.email) {
      notifyEstimateCustomer({
        estimateId: estimate.id,
        customerName: contact.name,
        customerEmail: contact.email,
        address: project.address,
        total,
        costTotal,
        lineItems: emailLineItems,
        propertyDetails: propertyDetailsForEmail,
      }).catch((err) => console.error('[notify] notifyEstimateCustomer failed:', err));
    }

    // --- Response -----------------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        estimateId: estimate.id,
        message: 'Estimate submitted successfully',
      },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (error: any) {
    console.error('[api/estimates] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
