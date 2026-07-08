'use client';

import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Modal, Progress, Space, Table, Tag, Typography, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useBulkImportChunk } from '@/hooks/useDocuments';

const { Dragger } = Upload;
const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

type Phase = 'idle' | 'parsing' | 'parsed' | 'importing' | 'done';

interface InvalidSampleRow {
  rowIndex: number;
  data: Record<string, any>;
  errors: string[];
}

const IMPORT_CHUNK_SIZE = 2000;

export default function BulkImportModal({ open, onClose, onRefresh }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [fileName, setFileName] = useState('');
  const [processed, setProcessed] = useState(0);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [invalidSample, setInvalidSample] = useState<InvalidSampleRow[]>([]);
  const [validRows, setValidRows] = useState<Record<string, any>[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ inserted: number; duplicates: number } | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const bulkImportMutation = useBulkImportChunk();

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const reset = () => {
    setPhase('idle');
    setFileName('');
    setProcessed(0);
    setValidCount(0);
    setInvalidCount(0);
    setInvalidSample([]);
    setValidRows([]);
    setImportProgress(0);
    setImportResult(null);
    workerRef.current?.terminate();
    workerRef.current = null;
  };

  const handleClose = () => {
    onClose();
    reset()
  };

  const startParsing = (file: File) => {
    setPhase('parsing');
    setFileName(file.name);
    setProcessed(0);
    setValidCount(0);
    setInvalidCount(0);

    const isExcel = /\.xlsx?$/i.test(file.name);
    const worker = new Worker(new URL('../workers/import.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<any>) => {
      const msg = e.data;
      console.log('msg', msg)
      if (msg.type === 'progress') {
        setProcessed(msg.processed);
        setValidCount(msg.validCount);
        setInvalidCount(msg.invalidCount);
      } else if (msg.type === 'done') {
        setValidRows(msg.validRows);
        setInvalidSample(msg.invalidSample);
        setInvalidCount(msg.invalidCount);
        setValidCount(msg.validRows.length);
        setPhase('parsed');
        worker.terminate();
      } else if (msg.type === 'error') {
        message.error(`Parse failed: ${msg.message}`);
        setPhase('idle');
        worker.terminate();
      }
    };

    worker.postMessage({ type: 'start', file, fileKind: isExcel ? 'excel' : 'csv' });
  };

  const uploadProps: UploadProps = {
    multiple: false,
    accept: '.csv,.xlsx,.xls',
    showUploadList: false,
    beforeUpload: (file) => {
      startParsing(file as unknown as File);
      return false; // prevent antd's default upload behavior
    },
  };

  const runImport = async () => {
    setPhase('importing');
    let inserted = 0;
    let duplicates = 0;
    try {
      for (let i = 0; i < validRows.length; i += IMPORT_CHUNK_SIZE) {
        const chunk = validRows.slice(i, i + IMPORT_CHUNK_SIZE);
        const res = await bulkImportMutation.mutateAsync(chunk);
        inserted += res.inserted;
        duplicates += res.duplicates.length;
        setImportProgress(Math.round(Math.min(i + chunk.length, validRows.length) / (validRows.length || 1) * 100));
      }
      setImportResult({ inserted, duplicates });
      setPhase('done');
      message.success(`Imported ${inserted} document(s)`);
      onRefresh();
    } catch (e: any) {
      message.error(e?.message || 'Import failed');
      setPhase('parsed');
    }
  };

  const invalidColumns = [
    { title: 'Row #', dataIndex: 'rowIndex', width: 70 },
    { title: 'Code', dataIndex: ['data', 'code'], width: 120 },
    { title: 'Title', dataIndex: ['data', 'title'], width: 180 },
    {
      title: 'Errors',
      dataIndex: 'errors',
      render: (errors: string[]) => (
        <Space size={4} wrap>
          {errors.map((e, i) => (
            <Tag color="red" key={i}>
              {e}
            </Tag>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title="Bulk Import Documents"
      open={open}
      onCancel={handleClose}
      width={780}
      footer={
        phase === 'parsed'
          ? [
              <Button key="cancel" onClick={handleClose}>
                Cancel
              </Button>,
              <Button key="import" type="primary" disabled={validRows.length === 0} onClick={runImport}>
                Import {validRows.length} valid row(s)
              </Button>,
            ]
          : phase === 'done'
          ? [
              <Button key="close" type="primary" onClick={handleClose}>
                Close
              </Button>,
            ]
          : [
              <Button key="close" onClick={handleClose}>
                Close
              </Button>,
            ]
      }
      destroyOnClose
    >
      {phase === 'idle' && (
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag a CSV / Excel file to this area</p>
          <p className="ant-upload-hint">
            Supports files with tens of thousands to hundreds of thousands of rows. Parsing runs in a
            background Web Worker so the UI stays responsive.
          </p>
        </Dragger>
      )}

      {phase === 'parsing' && (
        <div>
          <Text>Parsing &amp; validating {fileName}…</Text>
          <Progress percent={100} status="active" showInfo={false} style={{ marginTop: 12 }} />
          <div style={{ marginTop: 12 }}>
            <Space size={24}>
              <Text>Processed: {processed.toLocaleString()}</Text>
              <Text type="success">Valid: {validCount.toLocaleString()}</Text>
              <Text type="danger">Invalid: {invalidCount.toLocaleString()}</Text>
            </Space>
          </div>
        </div>
      )}

      {(phase === 'parsed' || phase === 'importing' || phase === 'done') && (
        <div>
          <Alert
            type={invalidCount > 0 ? 'warning' : 'success'}
            showIcon
            message={`Parsed ${processed.toLocaleString()} row(s) from ${fileName}`}
            description={
              <Space size={16}>
                <Text type="success">{validCount.toLocaleString()} valid</Text>
                <Text type="danger">{invalidCount.toLocaleString()} invalid</Text>
              </Space>
            }
            style={{ marginBottom: 16 }}
          />

          {phase === 'importing' && (
            <div style={{ marginBottom: 16 }}>
              <Text>Importing…</Text>
              <Progress percent={importProgress} />
            </div>
          )}

          {phase === 'done' && importResult && (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
              message={`Import complete: ${importResult.inserted} inserted, ${importResult.duplicates} skipped as duplicates`}
            />
          )}

          {invalidSample.length > 0 && (
            <div>
              <Text strong>
                Invalid rows {invalidCount > invalidSample.length ? `(showing first ${invalidSample.length} of ${invalidCount})` : ''}
              </Text>
              <div className="evd-invalid-table" style={{ marginTop: 8 }}>
                <Table
                  size="small"
                  rowKey="rowIndex"
                  columns={invalidColumns as any}
                  dataSource={invalidSample}
                  pagination={{ pageSize: 10 }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
