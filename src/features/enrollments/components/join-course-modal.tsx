"use client";

import { Form, Input, Modal, message } from "antd";

import type { CourseCatalogItem } from "../types/course-catalog.type";

type JoinCourseModalProps = {
  open: boolean;
  course: CourseCatalogItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

type JoinCourseFormValues = {
  key?: string;
};

export default function JoinCourseModal({
  open,
  course,
  onClose,
  onSuccess,
}: JoinCourseModalProps) {
  const [form] = Form.useForm<JoinCourseFormValues>();

  async function onFinish(values: JoinCourseFormValues) {
    if (!course) return;

    try {
      const res = await fetch("/api/enrollments/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: course.id,
          key: values.key || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal join course.");
      }

      message.success(json.message || "Berhasil join course.");
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    }
  }

  return (
    <Modal
      title="Join Course"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Join"
    >
      <div className="mb-4 rounded border border-slate-200 bg-slate-50 p-3">
        <p className="m-0 font-semibold text-slate-900">{course?.title}</p>
        <p className="m-0 mt-1 text-xs text-slate-500">
          Masukkan enroll key jika course ini membutuhkan kode akses.
        </p>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="Enroll Key" name="key">
          <Input placeholder="Contoh: CKCK-2026" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
