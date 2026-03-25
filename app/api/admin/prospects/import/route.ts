import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import Papa from 'papaparse';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'CSV file is required' }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json({ error: 'Failed to parse CSV', details: parsed.errors }, { status: 400 });
    }

    const rows = parsed.data as Record<string, string>[];
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const address = row.address || row.Address || '';
      const city = row.city || row.City || '';

      if (!address || !city) {
        skipped++;
        errors.push(`Row ${i + 1}: missing address or city`);
        continue;
      }

      try {
        await prisma.prospects.create({
          data: {
            name: row.name || row.Name || null,
            address,
            city,
            neighborhood: row.neighborhood || row.Neighborhood || null,
            zip: row.zip || row.Zip || row.ZIP || null,
            phone: row.phone || row.Phone || null,
            email: row.email || row.Email || null,
            source: 'csv_import',
            notes: row.notes || row.Notes || null,
          },
        });
        imported++;
      } catch (err: any) {
        skipped++;
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return NextResponse.json({ imported, skipped, totalRows: rows.length, errors: errors.slice(0, 20) });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
