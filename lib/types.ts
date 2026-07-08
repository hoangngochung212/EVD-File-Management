export type DocStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
export type DocCategory = 'Contract' | 'Invoice' | 'Report' | 'Policy' | 'Other';
export type Role = 'ADMIN' | 'STAFF';

export const CATEGORIES: DocCategory[] = ['Contract', 'Invoice', 'Report', 'Policy', 'Other'];
export const STATUSES: DocStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'];

export interface DocumentItem {
  id: string;
  code: string;
  title: string;
  category: DocCategory;
  status: DocStatus;
  createdBy: string;
  createdDate: string; // ISO string
}

export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DocumentQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  category?: string;
  createdBy?: string;
}

export interface InvalidRow {
  rowIndex: number;
  data: Record<string, any>;
  errors: string[];
}
