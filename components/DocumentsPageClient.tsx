'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Card, Segmented, Space } from 'antd';
import { AppstoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import FilterBar from '@/components/FilterBar';
import DocumentTable, { TableViewMode } from '@/components/DocumentTable';
import DocumentFormModal from '@/components/DocumentFormModal';
import BulkImportModal from '@/components/BulkImportModal';
import { useAppStore } from '@/store/useAppStore';
import { DocumentItem } from '@/lib/types';

const { Title } = Typography;

interface Props {
  data: DocumentItem[];
  total: number;
  viewMode: TableViewMode;
  page: number;
  pageSize: number;
  search: string;
  status: string;
  category: string;
  createdBy: string;
}

function buildSearchParams(values: {
  search: string;
  status: string;
  category: string;
  createdBy: string;
  view: TableViewMode;
  page: number;
  pageSize: number;
}) {
  const params = new URLSearchParams();
  if (values.search) params.set('search', values.search);
  if (values.status) params.set('status', values.status);
  if (values.category) params.set('category', values.category);
  if (values.createdBy) params.set('createdBy', values.createdBy);
  params.set('view', values.view);
  if (values.view === 'paginated') {
    params.set('page', String(values.page));
    params.set('pageSize', String(values.pageSize));
  }
  return params;
}

export default function DocumentsPageClient({
  data,
  total,
  viewMode,
  page,
  pageSize,
  search,
  status,
  category,
  createdBy,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { role, currentUser } = useAppStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DocumentItem | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const navigate = useCallback(
    (next: {
      search: string;
      status: string;
      category: string;
      createdBy: string;
      view: TableViewMode;
      page: number;
      pageSize: number;
    }) => {
      const params = buildSearchParams(next);
      startTransition(() => {
        router.push(`/documents?${params.toString()}`);
      });
    },
    [router]
  );

  useEffect(() => {
    const expectedCreatedBy = role === 'STAFF' ? currentUser : '';
    if (expectedCreatedBy !== createdBy) {
      navigate({ search, status, category, createdBy: expectedCreatedBy, view: viewMode, page: 1, pageSize });
    }
  }, [role, currentUser, createdBy, search, status, category, viewMode, pageSize, navigate]);

  const updateFilter =
    (field: 'search' | 'status' | 'category') =>
    (value: string) => {
      navigate({
        search: field === 'search' ? value : search,
        status: field === 'status' ? value : status,
        category: field === 'category' ? value : category,
        createdBy,
        view: viewMode,
        page: 1,
        pageSize,
      });
    };

  const handleViewChange = (nextView: TableViewMode) => {
    navigate({
      search,
      status,
      category,
      createdBy,
      view: nextView,
      page: 1,
      pageSize,
    });
  };

  const handlePageChange = (nextPage: number, nextPageSize: number) => {
    navigate({
      search,
      status,
      category,
      createdBy,
      view: viewMode,
      page: nextPage,
      pageSize: nextPageSize,
    });
  };

  const handleRefresh = () => {
    startTransition(() => router.refresh());
  };

  return (
    <div className="evd-page">
      <Title level={3} style={{ marginBottom: 4 }}>
        EVD — File Management
      </Title>
      <p style={{ color: '#888', marginTop: 0, marginBottom: 20 }}>Documents</p>

      <Card>
        <FilterBar
          search={search}
          status={status}
          category={category}
          onSearchChange={updateFilter('search')}
          onStatusChange={updateFilter('status')}
          onCategoryChange={updateFilter('category')}
          onCreate={() => {
            setEditingRecord(null);
            setFormOpen(true);
          }}
          onImport={() => setImportOpen(true)}
          onRefresh={handleRefresh}
        />

        <div style={{ marginTop: 16, marginBottom: 12 }}>
          <Space wrap>
            <span style={{ color: '#888', fontSize: 13 }}>Table view:</span>
            <Segmented
              value={viewMode}
              onChange={(v) => handleViewChange(v as TableViewMode)}
              options={[
                { label: 'Paginated', value: 'paginated', icon: <UnorderedListOutlined /> },
                { label: 'Virtual scroll', value: 'virtual', icon: <AppstoreOutlined /> },
              ]}
            />
          </Space>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <DocumentTable
            viewMode={viewMode}
            data={data}
            total={total}
            page={page}
            pageSize={pageSize}
            loading={isPending}
            onPageChange={handlePageChange}
            onOpenEditModal={(record) => {
              setEditingRecord(record);
              setFormOpen(true);
            }}
          />
        </div>
      </Card>

      <DocumentFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
        }}
        onRefresh={handleRefresh}
        record={editingRecord}
      />
      <BulkImportModal
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
        }}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
