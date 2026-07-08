'use client';

import { memo, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Alert, Button, Empty, Input, Popconfirm, Select, Spin } from 'antd';
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, FormOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { CATEGORIES, DocumentItem, STATUSES } from '@/lib/types';
import { useDocumentRowEditing } from '@/hooks/useDocumentRowEditing';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '../StatusBadge';
import DocumentTableToolbar from './DocumentTableToolbar';
import { GRID_TEMPLATE, ROW_HEIGHT, TABLE_COLUMNS, TABLE_MIN_WIDTH, VIRTUAL_OVERSCAN } from './constants';

interface Props {
  data: DocumentItem[];
  total: number;
  loading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onOpenEditModal: (record: DocumentItem) => void;
}

const CATEGORY_OPTIONS = CATEGORIES.map((o) => ({ label: o, value: o }));
const STATUS_OPTIONS = STATUSES.map((o) => ({ label: o, value: o }));

interface VirtualRowProps {
  record: DocumentItem;
  virtualIndex: number;
  isEditing: boolean;
  isStaff: boolean;
  rowStyle: React.CSSProperties;
  measureRef?: (node: Element | null) => void;
  editValues: Partial<Pick<DocumentItem, 'code' | 'title' | 'category' | 'status'>>;
  editErrors: Record<string, string>;
  saving: boolean;
  onSetField: (field: 'code' | 'title' | 'category' | 'status', value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveRow: () => void;
  onOpenEditModal: () => void;
  onDelete: () => void;
}

const VirtualRow = memo(function VirtualRow({
  record,
  virtualIndex,
  isEditing,
  isStaff,
  rowStyle,
  measureRef,
  editValues,
  editErrors,
  saving,
  onSetField,
  onStartEdit,
  onCancelEdit,
  onSaveRow,
  onOpenEditModal,
  onDelete,
}: VirtualRowProps) {
  const formattedDate = useMemo(() => dayjs(record.createdDate).format('YYYY-MM-DD HH:mm'), [record.createdDate]);
  const rowRef = useCallback(
    (node: HTMLDivElement | null) => {
      measureRef?.(node);
    },
    [measureRef]
  );

  if (isEditing) {
    return (
      <div
        ref={rowRef}
        className="evd-virtual-table-row evd-editing-row"
        style={rowStyle}
        data-index={virtualIndex}
      >
        <div className="evd-virtual-table-cell">
          <Input
            size="small"
            value={editValues.code ?? record.code}
            status={editErrors.code ? 'error' : undefined}
            onChange={(e) => onSetField('code', e.target.value)}
          />
          {editErrors.code ? <div className="evd-cell-error">{editErrors.code}</div> : null}
        </div>
        <div className="evd-virtual-table-cell">
          <Input
            size="small"
            value={editValues.title ?? record.title}
            status={editErrors.title ? 'error' : undefined}
            onChange={(e) => onSetField('title', e.target.value)}
          />
          {editErrors.title ? <div className="evd-cell-error">{editErrors.title}</div> : null}
        </div>
        <div className="evd-virtual-table-cell">
          <Select
            size="small"
            style={{ width: '100%' }}
            value={editValues.category ?? record.category}
            status={editErrors.category ? 'error' : undefined}
            options={CATEGORY_OPTIONS}
            onChange={(v) => onSetField('category', v)}
          />
        </div>
        <div className="evd-virtual-table-cell">
          <Select
            size="small"
            style={{ width: '100%' }}
            value={editValues.status ?? record.status}
            status={editErrors.status ? 'error' : undefined}
            options={STATUS_OPTIONS}
            onChange={(v) => onSetField('status', v)}
          />
        </div>
        <div className="evd-virtual-table-cell">{record.createdBy}</div>
        <div className="evd-virtual-table-cell">{formattedDate}</div>
        <div className="evd-virtual-table-cell evd-virtual-actions">
          <button type="button" className="evd-action-btn evd-action-btn-primary" disabled={saving} onClick={onSaveRow} title="Save row">
            <CheckOutlined />
          </button>
          <button type="button" className="evd-action-btn" onClick={onCancelEdit} title="Cancel">
            <CloseOutlined />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={rowRef} className="evd-virtual-table-row" style={rowStyle} data-index={virtualIndex}>
      <div className="evd-virtual-table-cell" title={record.code}>
        {record.code}
      </div>
      <div className="evd-virtual-table-cell" title={record.title}>
        {record.title}
      </div>
      <div className="evd-virtual-table-cell">{record.category}</div>
      <div className="evd-virtual-table-cell">
        <StatusBadge status={record.status} />
      </div>
      <div className="evd-virtual-table-cell">{record.createdBy}</div>
      <div className="evd-virtual-table-cell">{formattedDate}</div>
      <div className="evd-virtual-table-cell evd-virtual-actions">
        <button type="button" className="evd-action-btn" onClick={onStartEdit} title="Quick edit">
          <EditOutlined />
        </button>
        <button type="button" className="evd-action-btn" onClick={onOpenEditModal} title="Edit via form">
          <FormOutlined />
        </button>
        {!isStaff && (
          <Popconfirm
            title="Delete this document?"
            description={`This will permanently delete ${record.code}.`}
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={onDelete}
          >
            <button type="button" className="evd-action-btn evd-action-btn-danger" title="Delete">
              <DeleteOutlined />
            </button>
          </Popconfirm>
        )}
      </div>
    </div>
  );
});

export default function DocumentVirtualTable({
  data,
  total,
  loading = false,
  isError = false,
  errorMessage,
  onRetry,
  onOpenEditModal,
}: Props) {
  const router = useRouter();
  const { role } = useAppStore();
  const isStaff = role === 'STAFF';
  const parentRef = useRef<HTMLDivElement>(null);

  const refreshData = useCallback(() => router.refresh(), [router]);

  const {
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
  } = useDocumentRowEditing(data, refreshData);

  const getScrollElement = useCallback(() => parentRef.current, []);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement,
    estimateSize: () => ROW_HEIGHT,
    overscan: VIRTUAL_OVERSCAN,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  if (isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Failed to load documents"
        description={errorMessage || 'Something went wrong while calling the API.'}
        action={
          onRetry ? (
            <Button size="small" danger onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
      />
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div>
      <DocumentTableToolbar
        dirtyCount={dirtyCount}
        saving={batchMutation.isPending}
        onSaveAll={saveAll}
        onCancelAll={cancelAll}
      />

      <div className="evd-virtual-table" style={{ minWidth: TABLE_MIN_WIDTH, ['--evd-grid-cols' as string]: GRID_TEMPLATE }}>
        <div className="evd-virtual-table-header">
          {TABLE_COLUMNS.map((col) => (
            <div key={col.key} className="evd-virtual-table-cell">
              {col.label}
            </div>
          ))}
        </div>

        <div ref={parentRef} className="evd-virtual-table-body">
          {loading && (
            <div className="evd-virtual-table-loading">
              <Spin />
            </div>
          )}

          {data.length === 0 && !loading ? (
            <Empty description="No documents found" style={{ marginTop: 48 }} />
          ) : (
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
              {virtualItems.map((virtualRow) => {
                const record = data[virtualRow.index];
                const isEditing = editingIds.has(record.id);
                return (
                  <VirtualRow
                    key={record.id}
                    record={record}
                    virtualIndex={virtualRow.index}
                    isEditing={isEditing}
                    isStaff={isStaff}
                    measureRef={virtualizer.measureElement}
                    rowStyle={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translate3d(0, ${virtualRow.start}px, 0)`,
                    }}
                    editValues={editValues[record.id] || {}}
                    editErrors={editErrors[record.id] || {}}
                    saving={updateMutation.isPending}
                    onSetField={(field, value) => setField(record.id, field, value)}
                    onStartEdit={() => startEdit(record)}
                    onCancelEdit={() => cancelEdit(record.id)}
                    onSaveRow={() => saveRow(record)}
                    onOpenEditModal={() => onOpenEditModal(record)}
                    onDelete={() => handleDelete(record.id, record.code)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
