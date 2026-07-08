import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  batchUpdateDocuments,
  bulkImportChunk,
  createDocument,
  deleteDocument,
  fetchDocuments,
  updateDocument,
} from '@/lib/api';
import { DocumentItem, DocumentQuery } from '@/lib/types';

const KEY = 'documents';

export function useDocumentsQuery(query: DocumentQuery) {
  return useQuery({
    queryKey: [KEY, query],
    queryFn: () => fetchDocuments(query),
    placeholderData: (prev) => prev,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<DocumentItem>) => createDocument(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<DocumentItem> }) => updateDocument(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useBatchUpdateDocuments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: { id: string; changes: Partial<DocumentItem> }[]) => batchUpdateDocuments(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useBulkImportChunk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: Partial<DocumentItem>[]) => bulkImportChunk(rows),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
