import { DocCategory, DocStatus, DocumentItem } from '@/lib/types';

const CATEGORIES: DocCategory[] = ['Contract', 'Invoice', 'Report', 'Policy', 'Other'];
const STATUSES: DocStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'];
const USERS = ['alice', 'bob', 'carol', 'dave'];

function genSeed(count = 500): DocumentItem[] {
  const arr: DocumentItem[] = [];
  for (let i = 1; i <= count; i++) {
    arr.push({
      id: 'doc-' + i,
      code: 'DOC-' + String(i).padStart(5, '0'),
      title: `Document title sample ${i}`,
      category: CATEGORIES[i % CATEGORIES.length],
      status: STATUSES[i % STATUSES.length],
      createdBy: USERS[i % USERS.length],
      createdDate: new Date(Date.now() - i * 3600 * 1000).toISOString(),
    });
  }
  return arr;
}

declare global {
  // eslint-disable-next-line no-var
  var __EVD_DOCS__: DocumentItem[] | undefined;
}

export function getStore(): DocumentItem[] {
  if (!globalThis.__EVD_DOCS__) {
    globalThis.__EVD_DOCS__ = genSeed(500);
  }
  return globalThis.__EVD_DOCS__;
}
