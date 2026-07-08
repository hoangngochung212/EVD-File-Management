'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Button,
  Empty,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tooltip,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  FormOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { CATEGORIES, DocumentItem, STATUSES } from '@/lib/types';
import { useDocumentRowEditing } from '@/hooks/useDocumentRowEditing';
import { useAppStore } from '@/store/useAppStore';
import StatusBadge from '../StatusBadge';
import DocumentTableToolbar from './DocumentTableToolbar';

interface Props {
  data: DocumentItem[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onPageChange: (page: number, pageSize: number) => void;
  onOpenEditModal: (record: DocumentItem) => void;
}

export default function DocumentPaginatedTable({
  data,
  total,
  page,
  pageSize,
  loading = false,
  isError = false,
  errorMessage,
  onRetry,
  onPageChange,
  onOpenEditModal,
}: Props) {
  const router = useRouter();
  const { role } = useAppStore();
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

  const renderEditableText = (record: DocumentItem, field: 'code' | 'title') => {
    const value = editValues[record.id]?.[field] ?? record[field];
    const err = editErrors[record.id]?.[field];
    return (
      <div>
        <Input
          size="small"
          value={value}
          status={err ? 'error' : undefined}
          onChange={(e) => setField(record.id, field, e.target.value)}
        />
        {err ? <div className="evd-cell-error">{err}</div> : null}
      </div>
    );
  };

  const renderEditableSelect = (record: DocumentItem, field: 'category' | 'status', options: string[]) => {
    const value = editValues[record.id]?.[field] ?? record[field];
    const err = editErrors[record.id]?.[field];
    return (
      <div>
        <Select
          size="small"
          style={{ width: '100%' }}
          value={value}
          status={err ? 'error' : undefined}
          options={options.map((o) => ({ label: o, value: o }))}
          onChange={(v) => setField(record.id, field, v)}
        />
        {err ? <div className="evd-cell-error">{err}</div> : null}
      </div>
    );
  };

  const columns: ColumnsType<DocumentItem> = useMemo(
    () => [
      {
        title: 'Code',
        dataIndex: 'code',
        key: 'code',
        width: 160,
        render: (_v, record) => (editingIds.has(record.id) ? renderEditableText(record, 'code') : record.code),
      },
      {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
        width: 280,
        render: (_v, record) => (editingIds.has(record.id) ? renderEditableText(record, 'title') : record.title),
      },
      {
        title: 'Category',
        dataIndex: 'category',
        key: 'category',
        width: 150,
        render: (_v, record) =>
          editingIds.has(record.id) ? renderEditableSelect(record, 'category', CATEGORIES) : record.category,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 170,
        render: (_v, record) =>
          editingIds.has(record.id) ? (
            renderEditableSelect(record, 'status', STATUSES)
          ) : (
            <StatusBadge status={record.status} />
          ),
      },
      {
        title: 'Created By',
        dataIndex: 'createdBy',
        key: 'createdBy',
        width: 130,
      },
      {
        title: 'Created Date',
        dataIndex: 'createdDate',
        key: 'createdDate',
        width: 170,
        render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: 'Actions',
        key: 'actions',
        fixed: 'right',
        width: role === 'STAFF' ? 100 : 120,
        render: (_v, record) => {
          const isEditing = editingIds.has(record.id);
          if (isEditing) {
            return (
              <Space size={4}>
                <Tooltip title="Save row">
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={updateMutation.isPending}
                    onClick={() => saveRow(record)}
                  />
                </Tooltip>
                <Tooltip title="Cancel">
                  <Button size="small" icon={<CloseOutlined />} onClick={() => cancelEdit(record.id)} />
                </Tooltip>
              </Space>
            );
          }
          return (
            <Space size={4}>
              <Tooltip title="Quick edit (inline, in-row)">
                <Button size="small" icon={<EditOutlined />} onClick={() => startEdit(record)} />
              </Tooltip>
              <Tooltip title="Edit via form">
                <Button size="small" icon={<FormOutlined />} onClick={() => onOpenEditModal(record)} />
              </Tooltip>
              {role !== 'STAFF' && (
                <Popconfirm
                  title="Delete this document?"
                  description={`This will permanently delete ${record.code}.`}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDelete(record.id, record.code)}
                >
                  <Tooltip title="Delete">
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              )}
            </Space>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingIds, editValues, editErrors, role, updateMutation.isPending]
  );

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

  return (
    <div>
      <DocumentTableToolbar
        dirtyCount={dirtyCount}
        saving={batchMutation.isPending}
        onSaveAll={saveAll}
        onCancelAll={cancelAll}
      />

      <Table<DocumentItem>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ y: 520, x: 1100 }}
        rowClassName={(record) => (editingIds.has(record.id) ? 'evd-editing-row' : '')}
        locale={{ emptyText: <Empty description="No documents found" /> }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `${t} document(s)`,
          onChange: onPageChange,
        }}
      />
    </div>
  );
}
