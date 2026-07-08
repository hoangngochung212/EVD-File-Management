import { CATEGORIES, DocumentItem, STATUSES } from './types';

export type FieldName = 'code' | 'title' | 'category' | 'status' | 'createdBy' | 'createdDate';

export function validateField(field: FieldName, value: any): string | null {
  switch (field) {
    case 'code': {
      if (value === undefined || value === null || String(value).trim() === '') return 'Code is required';
      if (String(value).trim().length > 30) return 'Code must be at most 30 characters';
      return null;
    }
    case 'title': {
      if (value === undefined || value === null || String(value).trim().length < 3) {
        return 'Title must be at least 3 characters';
      }
      if (String(value).trim().length > 200) return 'Title must be at most 200 characters';
      return null;
    }
    case 'category': {
      if (!CATEGORIES.includes(value)) return `Category must be one of: ${CATEGORIES.join(', ')}`;
      return null;
    }
    case 'status': {
      if (!STATUSES.includes(value)) return `Status must be one of: ${STATUSES.join(', ')}`;
      return null;
    }
    case 'createdBy': {
      if (!value || String(value).trim() === '') return 'Created by is required';
      return null;
    }
    case 'createdDate': {
      if (!value || isNaN(new Date(value).getTime())) return 'Created date is invalid';
      return null;
    }
    default:
      return null;
  }
}

export function validateDocument(doc: Partial<DocumentItem>): Record<string, string> {
  const errors: Record<string, string> = {};
  (['code', 'title', 'category', 'status'] as FieldName[]).forEach((f) => {
    const err = validateField(f, (doc as any)[f]);
    if (err) errors[f] = err;
  });
  return errors;
}

// Normalizes a raw CSV/Excel row (arbitrary string keys) into a DocumentItem-shaped object.
export function normalizeImportRow(raw: Record<string, any>): Partial<DocumentItem> {
  const get = (keys: string[]) => {
    for (const k of keys) {
      const found = Object.keys(raw).find((rk) => rk.trim().toLowerCase() === k);
      if (found && raw[found] !== undefined && raw[found] !== null && String(raw[found]).trim() !== '') {
        return String(raw[found]).trim();
      }
    }
    return '';
  };

  return {
    code: get(['code', 'document code', 'doc code']),
    title: get(['title', 'document title', 'name']),
    category: (get(['category']) || 'Other') as any,
    status: (get(['status']) || 'DRAFT').toUpperCase() as any,
    createdBy: get(['createdby', 'created by', 'author']) || '',
    createdDate: get(['createddate', 'created date', 'date']) || '',
  };
}
