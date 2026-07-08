'use client';

import { Button, Input, Select, Space, Segmented } from 'antd';
import { PlusOutlined, UploadOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, Role, STATUSES } from '@/lib/types';
import { useAppStore } from '@/store/useAppStore';

interface Props {
  search: string;
  status: string;
  category: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onCreate: () => void;
  onImport: () => void;
  onRefresh: () => void;
}

export default function FilterBar({
  search,
  status,
  category,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onCreate,
  onImport,
  onRefresh,
}: Props) {
  const { role, setRole, currentUser } = useAppStore();
  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearchChange(localSearch), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const statusOptions = useMemo(
    () => [{ label: 'All statuses', value: '' }, ...STATUSES.map((s) => ({ label: s, value: s }))],
    []
  );
  const categoryOptions = useMemo(
    () => [{ label: 'All categories', value: '' }, ...CATEGORIES.map((c) => ({ label: c, value: c }))],
    []
  );

  return (
    <Space wrap style={{ width: '100%', justifyContent: 'space-between' }} size={12}>
      <Space wrap>
        <Input.Search
          allowClear
          placeholder="Search by code or title..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          style={{ width: 260 }}
        />
        <Select
          style={{ width: 170 }}
          options={statusOptions}
          value={status}
          onChange={onStatusChange}
          placeholder="Status"
        />
        <Select
          style={{ width: 170 }}
          options={categoryOptions}
          value={category}
          onChange={onCategoryChange}
          placeholder="Category"
        />
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          Refresh
        </Button>
      </Space>
      <Space wrap>
        <Space size={4}>
          <span style={{ color: '#888', fontSize: 12 }}>Role (simulated{role === 'STAFF' ? ` - ${currentUser}` : ''}):</span>
          <Segmented
            value={role}
            onChange={(v) => setRole(v as Role)}
            options={[
              { label: 'Admin', value: 'ADMIN' },
              { label: 'Staff', value: 'STAFF' },
            ]}
          />
        </Space>
        <Button icon={<UploadOutlined />} onClick={onImport}>
          Bulk Import
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          New Document
        </Button>
      </Space>
    </Space>
  );
}
