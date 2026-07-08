import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '../../_data/seed';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const doc = getStore().find((d) => d.id === params.id);
  if (!doc) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const store = getStore();
  const idx = store.findIndex((d) => d.id === params.id);
  if (idx === -1) return NextResponse.json({ message: 'Not found' }, { status: 404 });

  const body = await req.json();

  if (body.code !== undefined && (!String(body.code).trim() || String(body.code).trim().length > 30)) {
    return NextResponse.json({ message: 'Invalid code' }, { status: 400 });
  }
  if (body.title !== undefined && String(body.title).trim().length < 3) {
    return NextResponse.json({ message: 'Title must be at least 3 characters' }, { status: 400 });
  }
  if (body.code && store.some((d) => d.id !== params.id && d.code.toLowerCase() === String(body.code).toLowerCase())) {
    return NextResponse.json({ message: `Code "${body.code}" already exists` }, { status: 409 });
  }

  store[idx] = { ...store[idx], ...body, id: store[idx].id };
  await new Promise((r) => setTimeout(r, 150));
  return NextResponse.json(store[idx]);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const store = getStore();
  const idx = store.findIndex((d) => d.id === params.id);
  if (idx === -1) return NextResponse.json({ message: 'Not found' }, { status: 404 });
  store.splice(idx, 1);
  await new Promise((r) => setTimeout(r, 150));
  return NextResponse.json({ id: params.id });
}
