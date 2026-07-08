import { getStore } from '@/app/api/_data/seed';
import { DocumentItem } from './types';

export interface DocumentsFilter {
  search?: string;
  status?: string;
  category?: string;
  createdBy?: string;
  page?: number;
  pageSize?: number;
}

export function queryDocuments(filter: DocumentsFilter = {}) {
  const search = (filter.search || '').toLowerCase().trim();
  const status = filter.status || '';
  const category = filter.category || '';
  const createdBy = filter.createdBy || '';

  let data = getStore();

  if (search) {
    data = data.filter(
      (d) => d.code.toLowerCase().includes(search) || d.title.toLowerCase().includes(search)
    );
  }
  if (status) data = data.filter((d) => d.status === status);
  if (category) data = data.filter((d) => d.category === category);
  if (createdBy) data = data.filter((d) => d.createdBy === createdBy);

  data = [...data].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());

  const total = data.length;

  if (filter.page != null && filter.pageSize != null) {
    const page = Math.max(1, filter.page);
    const pageSize = Math.min(Math.max(1, filter.pageSize), 200);
    const start = (page - 1) * pageSize;
    return { data: data.slice(start, start + pageSize), total, page, pageSize };
  }

  return { data, total };
}

export type DocumentsQueryResult = ReturnType<typeof queryDocuments> & {
  data: DocumentItem[];
};
