import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '../../_data/seed';
import { validateDocument } from '@/lib/validation';

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const items: { id: string; changes: Record<string, any> }[] = body.items || [];
  const store = getStore();

  const updated: any[] = [];
  const errors: { id: string; message: string }[] = [];

  for (const item of items) {
    const idx = store.findIndex((d) => d.id === item.id);
    if (idx === -1) {
      errors.push({ id: item.id, message: 'Document not found' });
      continue;
    }
    const merged = { ...store[idx], ...item.changes };
    const fieldErrors = validateDocument(merged);
    if (Object.keys(fieldErrors).length > 0) {
      errors.push({ id: item.id, message: Object.values(fieldErrors).join('; ') });
      continue;
    }
    if (
      item.changes.code &&
      store.some((d) => d.id !== item.id && d.code.toLowerCase() === String(item.changes.code).toLowerCase())
    ) {
      errors.push({ id: item.id, message: `Code "${item.changes.code}" already exists` });
      continue;
    }
    store[idx] = merged;
    updated.push(store[idx]);
  }

  await new Promise((r) => setTimeout(r, 200));
  return NextResponse.json({ updated, errors });
}
