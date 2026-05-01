"use client";

import dynamic from "next/dynamic";
import { forwardRef, useMemo, useRef } from "react";
import { Form, Input, InputNumber, Modal, Select, Switch, message } from "antd";

import type { LessonItem, LessonType } from "../types/course-builder.type";

const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill-new");

    const Quill = forwardRef<any, any>((props, ref) => (
      <RQ ref={ref} {...props} />
    ));

    Quill.displayName = "ReactQuill";

    return Quill;
  },
  {
    ssr: false,
  },
);

type LessonFormValues = {
  title: string;
  type: LessonType;
  contentHtml?: string;
  videoUrl?: string;
  fileUrl?: string;
  order: number;
  isPreview: boolean;
};

type LessonFormModalProps = {
  open: boolean;
  lesson: LessonItem | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: LessonFormValues) => void;
};

export default function LessonFormModal({
  open,
  lesson,
  loading,
  onClose,
  onSubmit,
}: LessonFormModalProps) {
  const [form] = Form.useForm<LessonFormValues>();
  const quillRef = useRef<any>(null);

  const lessonType = Form.useWatch("type", form);

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/uploads/lesson-image", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.message || "Upload gambar gagal.");
    }

    return json.data.url as string;
  }

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["blockquote", "code-block"],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: function () {
            const input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute("accept", "image/png,image/jpeg,image/webp");
            input.click();

            input.onchange = async () => {
              const file = input.files?.[0];

              if (!file) return;

              try {
                message.loading({
                  content: "Uploading image...",
                  key: "lesson-image-upload",
                });

                const imageUrl = await uploadImage(file);

                const editor = quillRef.current?.getEditor();
                const range = editor?.getSelection(true);

                editor?.insertEmbed(range?.index || 0, "image", imageUrl);
                editor?.setSelection((range?.index || 0) + 1);

                message.success({
                  content: "Image uploaded.",
                  key: "lesson-image-upload",
                });
              } catch (error) {
                message.error({
                  content:
                    error instanceof Error ? error.message : "Upload error.",
                  key: "lesson-image-upload",
                });
              }
            };
          },
        },
      },
    }),
    [],
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "align",
    "blockquote",
    "code-block",
    "link",
    "image",
  ];

  return (
    <Modal
      title={lesson ? "Edit Lesson" : "Create Lesson"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText={lesson ? "Update" : "Create"}
      width={980}
      afterOpenChange={(visible) => {
        if (!visible) return;

        if (lesson) {
          form.setFieldsValue({
            title: lesson.title,
            type: lesson.type,
            contentHtml: lesson.contentHtml || "",
            videoUrl: lesson.videoUrl || "",
            fileUrl: lesson.fileUrl || "",
            order: lesson.order,
            isPreview: lesson.isPreview,
          });
        } else {
          form.resetFields();
          form.setFieldsValue({
            type: "TEXT",
            order: 1,
            isPreview: false,
            contentHtml: "",
          });
        }
      }}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Form.Item
            label="Lesson Title"
            name="title"
            rules={[{ required: true, message: "Lesson title wajib diisi" }]}
          >
            <Input placeholder="Contoh: Apa itu LMS?" />
          </Form.Item>

          <Form.Item
            label="Lesson Type"
            name="type"
            rules={[{ required: true, message: "Lesson type wajib dipilih" }]}
          >
            <Select
              options={[
                { label: "Text", value: "TEXT" },
                { label: "Video", value: "VIDEO" },
                { label: "File", value: "FILE" },
                { label: "Quiz", value: "QUIZ" },
                { label: "Assignment", value: "ASSIGNMENT" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Order" name="order">
            <InputNumber className="w-full" min={0} />
          </Form.Item>

          <Form.Item
            label="Preview Lesson"
            name="isPreview"
            valuePropName="checked"
          >
            <Switch checkedChildren="YES" unCheckedChildren="NO" />
          </Form.Item>

          {lessonType === "VIDEO" ? (
            <Form.Item
              className="md:col-span-2"
              label="Video URL"
              name="videoUrl"
            >
              <Input placeholder="https://youtube.com/... atau video URL" />
            </Form.Item>
          ) : null}

          {lessonType === "FILE" ? (
            <Form.Item
              className="md:col-span-2"
              label="File URL"
              name="fileUrl"
            >
              <Input placeholder="/uploads/lessons/file.pdf atau https://..." />
            </Form.Item>
          ) : null}
        </div>

        <Form.Item label="Content" name="contentHtml">
          <ReactQuill
            ref={quillRef}
            theme="snow"
            modules={modules}
            formats={formats}
            className="lesson-quill bg-white"
            placeholder="Tulis konten lesson di sini..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
