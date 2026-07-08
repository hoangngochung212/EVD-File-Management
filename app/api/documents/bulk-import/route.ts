import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '../../_data/seed';
import { DocumentItem } from '@/lib/types';

// Accepts a chunk of pre-validated rows from the client (the client streams
// large files in chunks so a single request body never gets huge).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const rows: Partial<DocumentItem>[] = body.rows || [];
  const store = getStore();

  const existingCodes = new Set(store.map((d) => d.code.toLowerCase()));
  const duplicates: string[] = [];
  let inserted = 0;

  for (const row of rows) {
    const code = String(row.code || '').trim();
    if (!code || existingCodes.has(code.toLowerCase())) {
      duplicates.push(code || '(empty)');
      continue;
    }
    existingCodes.add(code.toLowerCase());
    store.push({
      id: 'doc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      code,
      title: String(row.title || '').trim(),
      category: (row.category as any) || 'Other',
      status: (row.status as any) || 'DRAFT',
      createdBy: row.createdBy || 'import',
      createdDate: row.createdDate || new Date().toISOString(),
    });
    inserted++;
  }

  return NextResponse.json({ inserted, duplicates });
}
