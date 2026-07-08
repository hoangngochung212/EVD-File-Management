'use client';

import { Tag } from 'antd';
import { DocStatus } from '@/lib/types';

const COLOR_MAP: Record<DocStatus, string> = {
  DRAFT: 'default',
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  ARCHIVED: 'purple',
};

export default function StatusBadge({ status }: { status: DocStatus }) {
  return <Tag color={COLOR_MAP[status] || 'default'}>{status}</Tag>;
}
