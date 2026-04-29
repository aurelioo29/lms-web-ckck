"use client";

import { useEffect, useState } from "react";
import { Form, Input, Modal, Select, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { CourseItem, InstructorOption } from "../types/course.type";

type CourseFormModalProps = {
  open: boolean;
  course: CourseItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

type CourseFormValues = {
  title: string;
  description?: string;
  thumbnail?: string;
  level?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  instructorId: string;
};

export default function CourseFormModal({
  open,
  course,
  onClose,
  onSuccess,
}: CourseFormModalProps) {
  const [form] = Form.useForm<CourseFormValues>();
  const [saving, setSaving] = useState(false);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);

  const isEdit = !!course;

  async function fetchInstructors() {
    try {
      const res = await fetch("/api/instructors/options", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal mengambil instructor.");
      }

      setInstructors(json.data || []);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    }
  }

  async function onFinish(values: CourseFormValues) {
    try {
      setSaving(true);

      const url = isEdit ? `/api/courses/${course.id}` : "/api/courses";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal menyimpan course.");
      }

      message.success(json.message || "Course berhasil disimpan.");
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    fetchInstructors();

    if (course) {
      form.setFieldsValue({
        title: course.title,
        description: course.description || "",
        thumbnail: course.thumbnail || "",
        level: course.level || "",
        status: course.status,
        instructorId: course.instructorId,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: "DRAFT",
      });
    }
  }, [open, course, form]);

  return (
    <Modal
      title={isEdit ? "Edit Course" : "Create Course"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText={isEdit ? "Update" : "Create"}
      width={760}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Form.Item
            label="Title"
            name="title"
            rules={[{ required: true, message: "Title wajib diisi" }]}
          >
            <Input placeholder="Contoh: Laravel Fundamental" />
          </Form.Item>

          <Form.Item
            label="Instructor"
            name="instructorId"
            rules={[{ required: true, message: "Instructor wajib dipilih" }]}
          >
            <Select
              showSearch
              placeholder="Pilih instructor"
              optionFilterProp="label"
              options={instructors.map((instructor) => ({
                label: `${instructor.name} (@${instructor.username})`,
                value: instructor.id,
              }))}
            />
          </Form.Item>

          <Form.Item label="Level" name="level">
            <Select
              allowClear
              placeholder="Pilih level"
              options={[
                { label: "Beginner", value: "Beginner" },
                { label: "Intermediate", value: "Intermediate" },
                { label: "Advanced", value: "Advanced" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Status wajib dipilih" }]}
          >
            <Select
              options={[
                { label: "Draft", value: "DRAFT" },
                { label: "Published", value: "PUBLISHED" },
                { label: "Archived", value: "ARCHIVED" },
              ]}
            />
          </Form.Item>

          <Form.Item
            className="md:col-span-2"
            label="Thumbnail URL"
            name="thumbnail"
          >
            <Input placeholder="/uploads/courses/course.png atau https://..." />
          </Form.Item>

          <Form.Item className="md:col-span-2" label="Upload Thumbnail">
            <Upload
              accept="image/png,image/jpeg,image/webp"
              showUploadList={false}
              customRequest={async ({ file, onSuccess, onError }) => {
                try {
                  const formData = new FormData();
                  formData.append("file", file as File);

                  const res = await fetch("/api/uploads/course-thumbnail", {
                    method: "POST",
                    body: formData,
                  });

                  const json = await res.json();

                  if (!res.ok) {
                    throw new Error(json.message || "Upload gagal.");
                  }

                  form.setFieldValue("thumbnail", json.data.url);
                  message.success("Thumbnail berhasil diupload.");
                  onSuccess?.(json);
                } catch (error) {
                  message.error(
                    error instanceof Error ? error.message : "Upload error.",
                  );
                  onError?.(error as Error);
                }
              }}
            >
              <Button icon={<UploadOutlined />}>Upload Thumbnail</Button>
            </Upload>
          </Form.Item>
        </div>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={4} placeholder="Deskripsi course" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
