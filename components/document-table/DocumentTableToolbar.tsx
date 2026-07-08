import { Button, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

interface Props {
  dirtyCount: number;
  saving: boolean;
  onSaveAll: () => void;
  onCancelAll: () => void;
}

export default function DocumentTableToolbar({ dirtyCount, saving, onSaveAll, onCancelAll }: Props) {
  if (dirtyCount === 0) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <Space>
        <span>
          <b>{dirtyCount}</b> row(s) in edit mode
        </span>
        <Button size="small" type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSaveAll}>
          Save All
        </Button>
        <Button size="small" onClick={onCancelAll}>
          Cancel All
        </Button>
      </Space>
    </div>
  );
}
