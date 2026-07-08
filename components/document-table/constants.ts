export const ROW_HEIGHT = 48;
export const TABLE_MIN_WIDTH = 1260;
export const VIRTUAL_OVERSCAN = 3;

export const TABLE_COLUMNS = [
  { key: 'code', label: 'Code', width: 160 },
  { key: 'title', label: 'Title', width: 280 },
  { key: 'category', label: 'Category', width: 150 },
  { key: 'status', label: 'Status', width: 170 },
  { key: 'createdBy', label: 'Created By', width: 130 },
  { key: 'createdDate', label: 'Created Date', width: 170 },
  { key: 'actions', label: 'Actions', width: 200 },
] as const;

export const GRID_TEMPLATE = TABLE_COLUMNS.map((c) => `${c.width}px`).join(' ');

export type TableColumnKey = (typeof TABLE_COLUMNS)[number]['key'];

export type TableViewMode = 'paginated' | 'virtual';
