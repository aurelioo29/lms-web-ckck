"use client";

import { useState } from "react";
import { Button, Card, Form, Input, message } from "antd";

type ChangePasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ChangePasswordForm() {
  const [form] = Form.useForm<ChangePasswordValues>();
  const [loading, setLoading] = useState(false);

  async function onFinish(values: ChangePasswordValues) {
    try {
      setLoading(true);

      const res = await fetch("/api/profile/change-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengganti password.");
      }

      message.success(data.message || "Password berhasil diubah.");
      form.resetFields();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Change Password">
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Current Password"
          name="currentPassword"
          rules={[{ required: true, message: "Password lama wajib diisi" }]}
        >
          <Input.Password placeholder="Masukkan password lama" />
        </Form.Item>

        <Form.Item
          label="New Password"
          name="newPassword"
          rules={[
            { required: true, message: "Password baru wajib diisi" },
            { min: 6, message: "Password minimal 6 karakter" },
          ]}
        >
          <Input.Password placeholder="Masukkan password baru" />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Konfirmasi password wajib diisi" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }

                return Promise.reject(
                  new Error("Konfirmasi password tidak sama"),
                );
              },
            }),
          ]}
        >
          <Input.Password placeholder="Ulangi password baru" />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading}>
          Update Password
        </Button>
      </Form>
    </Card>
  );
}
