import { DocumentItem, DocumentQuery, InvalidRow, PagedResult } from './types';

const BASE = '/api/documents';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchDocuments(query: DocumentQuery): Promise<PagedResult<DocumentItem>> {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  if (query.search) params.set('search', query.search);
  if (query.status) params.set('status', query.status);
  if (query.category) params.set('category', query.category);
  if (query.createdBy) params.set('createdBy', query.createdBy);
  const res = await fetch(`${BASE}?${params.toString()}`);
  return handle(res);
}

export async function createDocument(payload: Partial<DocumentItem>): Promise<DocumentItem> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function updateDocument(id: string, payload: Partial<DocumentItem>): Promise<DocumentItem> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function deleteDocument(id: string): Promise<{ id: string }> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  return handle(res);
}

export async function batchUpdateDocuments(
  items: { id: string; changes: Partial<DocumentItem> }[]
): Promise<{ updated: DocumentItem[]; errors: { id: string; message: string }[] }> {
  const res = await fetch(`${BASE}/batch`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return handle(res);
}

export async function bulkImportChunk(
  rows: Partial<DocumentItem>[]
): Promise<{ inserted: number; duplicates: string[] }> {
  const res = await fetch(`${BASE}/bulk-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  return handle(res);
}

export type { InvalidRow };
