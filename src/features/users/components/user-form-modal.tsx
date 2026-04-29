"use client";

import { useEffect, useState } from "react";
import { Form, Input, Modal, Select, message } from "antd";

import type { RoleOption, UserItem } from "../types/user.type";

type UserFormModalProps = {
  open: boolean;
  user: UserItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

type UserFormValues = {
  name: string;
  username: string;
  email: string;
  phone?: string;
  bio?: string;
  password?: string;
  status: string;
  roleId?: string;
};

export default function UserFormModal({
  open,
  user,
  onClose,
  onSuccess,
}: UserFormModalProps) {
  const [form] = Form.useForm<UserFormValues>();
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  const isEdit = !!user;

  async function fetchRoles() {
    try {
      const res = await fetch("/api/roles/options", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal mengambil roles.");
      }

      setRoles(json.data || []);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    }
  }

  async function onFinish(values: UserFormValues) {
    try {
      setSaving(true);

      const url = isEdit ? `/api/users/${user.id}` : "/api/users";
      const method = isEdit ? "PATCH" : "POST";

      const payload = {
        ...values,
        password: values.password || "",
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal menyimpan user.");
      }

      message.success(json.message || "User berhasil disimpan.");
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
    if (open) {
      fetchRoles();

      if (user) {
        form.setFieldsValue({
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone || "",
          bio: user.bio || "",
          status: user.status,
          roleId: user.roles?.[0]?.role?.id,
          password: "",
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          status: "ACTIVE",
        });
      }
    }
  }, [open, user, form]);

  return (
    <Modal
      title={isEdit ? "Edit User" : "Create User"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText={isEdit ? "Update" : "Create"}
      width={720}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Name wajib diisi" }]}
          >
            <Input placeholder="Masukkan nama" />
          </Form.Item>

          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Username wajib diisi" }]}
          >
            <Input placeholder="Masukkan username" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email wajib diisi" },
              { type: "email", message: "Email tidak valid" },
            ]}
          >
            <Input placeholder="Masukkan email" />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input placeholder="Masukkan phone" />
          </Form.Item>

          <Form.Item
            label="Role"
            name="roleId"
            rules={[{ required: true, message: "Role wajib dipilih" }]}
          >
            <Select
              placeholder="Pilih role"
              options={roles.map((role) => ({
                label: role.name,
                value: role.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Status wajib dipilih" }]}
          >
            <Select
              options={[
                { label: "Active", value: "ACTIVE" },
                { label: "Pending", value: "PENDING" },
                { label: "Inactive", value: "INACTIVE" },
                { label: "Suspended", value: "SUSPENDED" },
                { label: "Declined", value: "DECLINED" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={isEdit ? "New Password" : "Password"}
            name="password"
            rules={
              isEdit
                ? [{ min: 6, message: "Password minimal 6 karakter" }]
                : [
                    { required: true, message: "Password wajib diisi" },
                    { min: 6, message: "Password minimal 6 karakter" },
                  ]
            }
          >
            <Input.Password
              placeholder={
                isEdit
                  ? "Kosongkan jika tidak ingin mengubah password"
                  : "Masukkan password"
              }
            />
          </Form.Item>
        </div>

        <Form.Item label="Bio" name="bio">
          <Input.TextArea rows={3} placeholder="Masukkan bio" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
