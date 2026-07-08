import { useCallback, useState } from 'react';
import { message } from 'antd';
import { DocumentItem } from '@/lib/types';
import { FieldName, validateField, validateDocument } from '@/lib/validation';
import { useBatchUpdateDocuments, useDeleteDocument, useUpdateDocument } from '@/hooks/useDocuments';

type EditValues = Partial<Pick<DocumentItem, 'code' | 'title' | 'category' | 'status'>>;

export function useDocumentRowEditing(data: DocumentItem[], onRefresh: () => void) {
  const deleteMutation = useDeleteDocument();
  const updateMutation = useUpdateDocument();
  const batchMutation = useBatchUpdateDocuments();

  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [editValues, setEditValues] = useState<Record<string, EditValues>>({});
  const [editErrors, setEditErrors] = useState<Record<string, Record<string, string>>>({});

  const dirtyCount = editingIds.size;

  const startEdit = useCallback((record: DocumentItem) => {
    setEditingIds((prev) => new Set(prev).add(record.id));
    setEditValues((prev) => ({ ...prev, [record.id]: {} }));
    setEditErrors((prev) => ({ ...prev, [record.id]: {} }));
  }, []);

  const cancelEdit = useCallback((id: string) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setEditValues((prev) => {
      const { [id]: _drop, ...rest } = prev;
      return rest;
    });
    setEditErrors((prev) => {
      const { [id]: _drop, ...rest } = prev;
      return rest;
    });
  }, []);

  const cancelAll = useCallback(() => {
    setEditingIds(new Set());
    setEditValues({});
    setEditErrors({});
  }, []);

  const setField = useCallback((id: string, field: FieldName, value: string) => {
    setEditValues((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    const err = validateField(field, value);
    setEditErrors((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: err || '' },
    }));
  }, []);

  const getMerged = useCallback(
    (record: DocumentItem): DocumentItem => ({
      ...record,
      ...(editValues[record.id] || {}),
    }),
    [editValues]
  );

  const saveRow = useCallback(
    async (record: DocumentItem) => {
      const merged = getMerged(record);
      const errors = validateDocument(merged);
      if (Object.keys(errors).length > 0) {
        setEditErrors((prev) => ({ ...prev, [record.id]: errors }));
        message.error('Fix the highlighted fields before saving');
        return;
      }
      const changes = editValues[record.id] || {};
      if (Object.keys(changes).length === 0) {
        cancelEdit(record.id);
        return;
      }
      try {
        await updateMutation.mutateAsync({ id: record.id, payload: changes });
        message.success(`Saved ${record.code}`);
        cancelEdit(record.id);
        onRefresh();
      } catch (e: unknown) {
        message.error(e instanceof Error ? e.message : 'Save failed');
      }
    },
    [cancelEdit, editValues, getMerged, onRefresh, updateMutation]
  );

  const saveAll = useCallback(async () => {
    const items = Array.from(editingIds)
      .map((id) => {
        const record = data.find((d) => d.id === id);
        if (!record) return null;
        const merged = getMerged(record);
        const errors = validateDocument(merged);
        if (Object.keys(errors).length > 0) {
          setEditErrors((prev) => ({ ...prev, [id]: errors }));
          return null;
        }
        const changes = editValues[id] || {};
        if (Object.keys(changes).length === 0) return null;
        return { id, changes };
      })
      .filter(Boolean) as { id: string; changes: EditValues }[];

    if (items.length === 0) {
      message.warning('No valid changes to save. Fix highlighted errors first.');
      return;
    }

    const res = await batchMutation.mutateAsync(items);
    if (res.updated.length) message.success(`Saved ${res.updated.length} row(s)`);
    if (res.errors.length) {
      res.errors.forEach((e) => {
        setEditErrors((prev) => ({ ...prev, [e.id]: { _server: e.message } }));
      });
      message.error(`${res.errors.length} row(s) failed to save`);
    }
    res.updated.forEach((u) => cancelEdit(u.id));
    onRefresh();
  }, [batchMutation, cancelEdit, data, editValues, editingIds, getMerged, onRefresh]);

  const handleDelete = useCallback(
    async (id: string, code: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        message.success(`Deleted ${code}`);
        onRefresh();
      } catch (e: unknown) {
        message.error(e instanceof Error ? e.message : 'Delete failed');
      }
    },
    [deleteMutation, onRefresh]
  );

  return {
    editingIds,
    editValues,
    editErrors,
    dirtyCount,
    startEdit,
    cancelEdit,
    cancelAll,
    setField,
    saveRow,
    saveAll,
    handleDelete,
    updateMutation,
    batchMutation,
  };
}
