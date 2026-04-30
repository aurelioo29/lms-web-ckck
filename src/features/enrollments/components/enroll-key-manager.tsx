"use client";

import { useEffect, useState } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Switch,
  Table,
  Tag,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Edit, Plus, Trash2 } from "lucide-react";

import type { EnrollKeyItem } from "../types/enroll-key.type";

type Props = {
  courseId: string;
};

type FormValues = {
  key: string;
  maxUsage?: number;
  expiredAt?: dayjs.Dayjs;
  isActive: boolean;
};

export default function EnrollKeyManager({ courseId }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [data, setData] = useState<EnrollKeyItem[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<EnrollKeyItem | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchKeys() {
    try {
      setLoading(true);

      const res = await fetch(`/api/courses/${courseId}/enroll-keys`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal mengambil enroll key.");
      }

      setData(json.data || []);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(values: FormValues) {
    try {
      const url = selected
        ? `/api/enroll-keys/${selected.id}`
        : `/api/courses/${courseId}/enroll-keys`;

      const method = selected ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key: values.key,
          maxUsage: values.maxUsage ?? null,
          expiredAt: values.expiredAt
            ? values.expiredAt.format("YYYY-MM-DD")
            : null,
          isActive: values.isActive,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal menyimpan enroll key.");
      }

      message.success(json.message || "Enroll key berhasil disimpan.");
      setOpen(false);
      setSelected(null);
      form.resetFields();
      fetchKeys();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    }
  }

  async function deleteKey(item: EnrollKeyItem) {
    Modal.confirm({
      title: "Delete enroll key?",
      content: `Key "${item.key}" akan dihapus.`,
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      async onOk() {
        const res = await fetch(`/api/enroll-keys/${item.id}`, {
          method: "DELETE",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Gagal menghapus enroll key.");
        }

        message.success(json.message || "Enroll key berhasil dihapus.");
        fetchKeys();
      },
    });
  }

  useEffect(() => {
    fetchKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const columns: ColumnsType<EnrollKeyItem> = [
    {
      title: "Key",
      dataIndex: "key",
      render: (value) => (
        <span className="font-mono font-semibold">{value}</span>
      ),
    },
    {
      title: "Usage",
      render: (_, record) =>
        `${record.usedCount}${record.maxUsage ? ` / ${record.maxUsage}` : ""}`,
    },
    {
      title: "Expired At",
      dataIndex: "expiredAt",
      render: (value) =>
        value ? new Date(value).toLocaleDateString("id-ID") : "-",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (value) =>
        value ? (
          <Tag color="green">ACTIVE</Tag>
        ) : (
          <Tag color="red">INACTIVE</Tag>
        ),
    },
    {
      title: "Actions",
      align: "center",
      render: (_, record) => (
        <div className="flex justify-center gap-1">
          <Button
            type="link"
            icon={<Edit size={14} />}
            onClick={() => {
              setSelected(record);
              form.setFieldsValue({
                key: record.key,
                maxUsage: record.maxUsage || undefined,
                expiredAt: record.expiredAt
                  ? dayjs(record.expiredAt)
                  : undefined,
                isActive: record.isActive,
              });
              setOpen(true);
            }}
          />

          <Button
            type="link"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => deleteKey(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="m-0 text-base font-semibold text-slate-900">
            Enroll Keys
          </h4>
          <p className="m-0 text-xs text-slate-500">
            Kode akses untuk join course. Jangan disebar ke grup random, kecuali
            kamu suka chaos.
          </p>
        </div>

        <Button
          type="primary"
          icon={<Plus size={14} />}
          onClick={() => {
            setSelected(null);
            form.resetFields();
            form.setFieldsValue({
              isActive: true,
            });
            setOpen(true);
          }}
        >
          Add Key
        </Button>
      </div>

      <Table
        rowKey="id"
        size="small"
        bordered
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={false}
      />

      <Modal
        title={selected ? "Edit Enroll Key" : "Create Enroll Key"}
        open={open}
        onCancel={() => {
          setOpen(false);
          setSelected(null);
        }}
        onOk={() => form.submit()}
        okText={selected ? "Update" : "Create"}
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item
            label="Enroll Key"
            name="key"
            rules={[{ required: true, message: "Enroll key wajib diisi" }]}
          >
            <Input placeholder="Contoh: CKCK-2026" />
          </Form.Item>

          <Form.Item label="Max Usage" name="maxUsage">
            <InputNumber
              className="w-full"
              min={1}
              placeholder="Kosongkan jika unlimited"
            />
          </Form.Item>

          <Form.Item label="Expired At" name="expiredAt">
            <DatePicker className="w-full" format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch checkedChildren="ON" unCheckedChildren="OFF" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
