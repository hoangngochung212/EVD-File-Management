'use client';

import { useCallback } from 'react';
import { DocumentItem } from '@/lib/types';
import { TableViewMode } from './document-table/constants';
import DocumentPaginatedTable from './document-table/DocumentPaginatedTable';
import DocumentVirtualTable from './document-table/DocumentVirtualTable';

interface Props {
  viewMode: TableViewMode;
  data: DocumentItem[];
  total: number;
  page?: number;
  pageSize?: number;
  loading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  onPageChange?: (page: number, pageSize: number) => void;
  onOpenEditModal: (record: DocumentItem) => void;
}

export default function DocumentTable({
  viewMode,
  data,
  total,
  page = 1,
  pageSize = 20,
  loading = false,
  isError = false,
  errorMessage,
  onRetry,
  onPageChange,
  onOpenEditModal,
}: Props) {
  const handlePageChange = useCallback(
    (nextPage: number, nextPageSize: number) => onPageChange?.(nextPage, nextPageSize),
    [onPageChange]
  );

  if (viewMode === 'paginated') {
    return (
      <DocumentPaginatedTable
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        loading={loading}
        isError={isError}
        errorMessage={errorMessage}
        onRetry={onRetry}
        onPageChange={handlePageChange}
        onOpenEditModal={onOpenEditModal}
      />
    );
  }

  return (
    <DocumentVirtualTable
      data={data}
      total={total}
      loading={loading}
      isError={isError}
      errorMessage={errorMessage}
      onRetry={onRetry}
      onOpenEditModal={onOpenEditModal}
    />
  );
}

export type { TableViewMode } from './document-table/constants';
