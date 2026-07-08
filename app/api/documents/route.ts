import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '../_data/seed';
import { queryDocuments } from '@/lib/documents-query';
import { DocumentItem } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 200);

  const result = queryDocuments({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
    createdBy: searchParams.get('createdBy') || '',
    page,
    pageSize,
  });

  // Simulate realistic network latency for loading-state demo purposes.
  await new Promise((r) => setTimeout(r, 250));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const store = getStore();

  if (!body.code || !String(body.code).trim() || !body.title || String(body.title).trim().length < 3) {
    return NextResponse.json({ message: 'code and title (min 3 chars) are required' }, { status: 400 });
  }
  if (store.some((d) => d.code.toLowerCase() === String(body.code).toLowerCase())) {
    return NextResponse.json({ message: `Code "${body.code}" already exists` }, { status: 409 });
  }

  const newDoc: DocumentItem = {
    id: "doc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    code: String(body.code).trim(),
    title: String(body.title).trim(),
    category: body.category || "Other",
    status: body.status || "DRAFT",
    createdBy: body.createdBy || "unknown",
    createdDate: body.createdDate || new Date().toISOString(),
  };
  store.unshift(newDoc);
  return NextResponse.json(newDoc, { status: 201 });
}
