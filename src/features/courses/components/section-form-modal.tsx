"use client";

import { Form, Input, InputNumber, Modal } from "antd";

import type { CourseSectionItem } from "../types/course-builder.type";

type SectionFormValues = {
  title: string;
  order: number;
};

type SectionFormModalProps = {
  open: boolean;
  section: CourseSectionItem | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: SectionFormValues) => void;
};

export default function SectionFormModal({
  open,
  section,
  loading,
  onClose,
  onSubmit,
}: SectionFormModalProps) {
  const [form] = Form.useForm<SectionFormValues>();

  return (
    <Modal
      title={section ? "Edit Section" : "Create Section"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText={section ? "Update" : "Create"}
      afterOpenChange={(visible) => {
        if (!visible) return;

        if (section) {
          form.setFieldsValue({
            title: section.title,
            order: section.order,
          });
        } else {
          form.resetFields();
          form.setFieldsValue({
            order: 1,
          });
        }
      }}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          label="Section Title"
          name="title"
          rules={[{ required: true, message: "Section title wajib diisi" }]}
        >
          <Input placeholder="Contoh: Introduction" />
        </Form.Item>

        <Form.Item label="Order" name="order">
          <InputNumber className="w-full" min={0} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
