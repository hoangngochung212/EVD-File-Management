import { queryDocuments } from '@/lib/documents-query';
import DocumentsPageClient from '@/components/DocumentsPageClient';
import { TableViewMode } from '@/components/document-table/constants';

interface PageProps {
  searchParams?: {
    search?: string;
    status?: string;
    category?: string;
    createdBy?: string;
    view?: string;
    page?: string;
    pageSize?: string;
  };
}

export default function DocumentsPage({ searchParams = {} }: PageProps) {
  const search = searchParams.search || '';
  const status = searchParams.status || '';
  const category = searchParams.category || '';
  const createdBy = searchParams.createdBy || '';
  const viewMode: TableViewMode = searchParams.view === 'paginated' ? 'paginated' : 'virtual';
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pageSize = Math.min(Math.max(1, parseInt(searchParams.pageSize || '20', 10) || 20), 200);

  const result =
    viewMode === 'paginated'
      ? queryDocuments({ search, status, category, createdBy, page, pageSize })
      : queryDocuments({ search, status, category, createdBy });

  return (
    <DocumentsPageClient
      data={result.data}
      total={result.total}
      viewMode={viewMode}
      page={page}
      pageSize={pageSize}
      search={search}
      status={status}
      category={category}
      createdBy={createdBy}
    />
  );
}
