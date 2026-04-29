"use client";

import { useState } from "react";
import { Button, Card, Form, Input, message } from "antd";

type ProfileFormProps = {
  user: {
    name: string;
    username: string;
    email: string;
    phone: string | null;
    bio: string | null;
  };
};

type ProfileFormValues = {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
};

export default function ProfileForm({ user }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);

  async function onFinish(values: ProfileFormValues) {
    try {
      setLoading(true);

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal memperbarui profile.");
      }

      message.success(data.message || "Profile berhasil diperbarui.");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Profile Information">
      <Form
        layout="vertical"
        initialValues={{
          name: user.name,
          username: user.username,
          email: user.email,
          phone: user.phone || "",
          bio: user.bio || "",
        }}
        onFinish={onFinish}
      >
        <Form.Item label="Username" name="username">
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Nama wajib diisi" }]}
        >
          <Input placeholder="Masukkan nama" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Email wajib diisi" },
            { type: "email", message: "Format email tidak valid" },
          ]}
        >
          <Input placeholder="Masukkan email" />
        </Form.Item>

        <Form.Item label="Phone" name="phone">
          <Input placeholder="Masukkan nomor telepon" />
        </Form.Item>

        <Form.Item label="Bio" name="bio">
          <Input.TextArea rows={4} placeholder="Masukkan bio singkat" />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading}>
          Save Changes
        </Button>
      </Form>
    </Card>
  );
}
