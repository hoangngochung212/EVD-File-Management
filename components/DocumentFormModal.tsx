'use client';

import { Form, Input, Modal, Select, DatePicker, message } from 'antd';
import { useEffect } from 'react';
import dayjs from 'dayjs';
import { CATEGORIES, DocumentItem, STATUSES } from '@/lib/types';
import { useCreateDocument, useUpdateDocument } from '@/hooks/useDocuments';
import { useAppStore } from '@/store/useAppStore';

interface Props {
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  record?: DocumentItem | null;
}

export default function DocumentFormModal({ open, onClose, record, onRefresh }: Props) {
  const [form] = Form.useForm();
  const createMutation = useCreateDocument();
  const updateMutation = useUpdateDocument();
  const { currentUser } = useAppStore();
  const isEdit = !!record;

  useEffect(() => {
    if (open) {
      if (record) {
        form.setFieldsValue({
          code: record.code,
          title: record.title,
          category: record.category,
          status: record.status,
          createdBy: record.createdBy,
          createdDate: dayjs(record.createdDate),
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          category: 'Other',
          status: 'DRAFT',
          createdBy: currentUser,
          createdDate: dayjs(),
        });
      }
    }
  }, [open, record, form, currentUser]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        createdDate: values.createdDate ? values.createdDate.toISOString() : new Date().toISOString(),
      };
      if (isEdit && record) {
        await updateMutation.mutateAsync({ id: record.id, payload });
        message.success('Document updated');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Document created');
      }
      onClose();
      onRefresh();
    } catch (err: any) {
      if (err?.errorFields) return; // antd validation error, already shown inline
      message.error(err?.message || 'Something went wrong');
    }
  };

  return (
    <Modal
      title={isEdit ? `Edit Document — ${record?.code}` : 'New Document'}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={createMutation.isPending || updateMutation.isPending}
      destroyOnClose
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item
          name="code"
          label="Code"
          rules={[
            { required: true, message: 'Code is required' },
            { max: 30, message: 'Max 30 characters' },
          ]}
        >
          <Input placeholder="e.g. DOC-00001" />
        </Form.Item>
        <Form.Item
          name="title"
          label="Title"
          rules={[
            { required: true, message: 'Title is required' },
            { min: 3, message: 'At least 3 characters' },
            { max: 200, message: 'Max 200 characters' },
          ]}
        >
          <Input placeholder="Document title" />
        </Form.Item>
        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
          <Select options={CATEGORIES.map((c) => ({ label: c, value: c }))} />
        </Form.Item>
        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select options={STATUSES.map((s) => ({ label: s, value: s }))} />
        </Form.Item>
        <Form.Item name="createdBy" label="Created By" rules={[{ required: true, message: 'Required' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="createdDate" label="Created Date" rules={[{ required: true, message: 'Required' }]}>
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
