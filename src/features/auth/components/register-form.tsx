"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Card, Form, Input, Spin, Typography } from "antd";
import {
  IdcardOutlined,
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const { Title, Text } = Typography;

type RegisterFormValues = {
  name: string;
  username: string;
  email: string;
  password: string;
};

type PublicSettings = {
  siteName: string;
  siteDescription: string;
  allowRegistration: boolean;
  approvalRequired: boolean;
  maintenanceMode: boolean;
};

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settings, setSettings] = useState<PublicSettings | null>(null);

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function fetchPublicSettings() {
    try {
      setSettingsLoading(true);

      const res = await fetch("/api/public/settings", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengambil settings.");
      }

      setSettings(data.data);
    } catch {
      setSettings({
        siteName: "CKCK LMS",
        siteDescription: "Learning Management System",
        allowRegistration: true,
        approvalRequired: true,
        maintenanceMode: false,
      });
    } finally {
      setSettingsLoading(false);
    }
  }

  async function onFinish(values: RegisterFormValues) {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registrasi gagal.");
      }

      setSuccess(data.message || "Registrasi berhasil.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPublicSettings();
  }, []);

  const isRegistrationClosed = settings && !settings.allowRegistration;

  return (
    <main className="auth-page">
      <Card className="auth-card">
        {settingsLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Spin />
          </div>
        ) : (
          <>
            <div className="auth-header">
              <Title level={2} className="auth-title">
                Register LMS
              </Title>

              <Text type="secondary">
                {isRegistrationClosed
                  ? "Pendaftaran akun sedang ditutup."
                  : settings?.approvalRequired
                    ? "Akun akan menunggu approval Superadmin."
                    : "Akun akan langsung aktif setelah register."}
              </Text>
            </div>

            {isRegistrationClosed ? (
              <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
                <p className="m-0 text-sm font-semibold text-orange-700">
                  Registration Closed
                </p>
                <p className="m-0 mt-1 text-sm text-orange-600">
                  Pendaftaran akun sedang ditutup oleh admin. Silakan hubungi
                  administrator kalau kamu memang harus masuk. Kalau tidak, ya
                  sabar. Sistem juga punya mood.
                </p>

                <div className="mt-4">
                  <Link href="/login">
                    <Button type="primary" block>
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}

            {settings?.maintenanceMode ? (
              <Alert
                type="warning"
                message="Maintenance Mode"
                description="Sistem sedang dalam maintenance. Beberapa fitur mungkin dibatasi."
                showIcon
                className="mb-4"
              />
            ) : null}

            {success ? (
              <Alert
                type="success"
                message="Registrasi berhasil"
                description={success}
                showIcon
                className="mb-4"
              />
            ) : null}

            {error ? (
              <Alert
                type="error"
                message="Registrasi gagal"
                description={error}
                showIcon
                className="mb-4"
              />
            ) : null}

            {!isRegistrationClosed ? (
              <Form layout="vertical" onFinish={onFinish}>
                <Form.Item
                  label="Nama Lengkap"
                  name="name"
                  rules={[{ required: true, message: "Nama wajib diisi" }]}
                >
                  <Input
                    size="large"
                    prefix={<IdcardOutlined />}
                    placeholder="Nama lengkap"
                  />
                </Form.Item>

                <Form.Item
                  label="Username"
                  name="username"
                  rules={[{ required: true, message: "Username wajib diisi" }]}
                >
                  <Input
                    size="large"
                    prefix={<UserOutlined />}
                    placeholder="contoh: aurelio"
                  />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Email wajib diisi" },
                    { type: "email", message: "Format email tidak valid" },
                  ]}
                >
                  <Input
                    size="large"
                    prefix={<MailOutlined />}
                    placeholder="email@example.com"
                  />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: "Password wajib diisi" },
                    { min: 6, message: "Password minimal 6 karakter" },
                  ]}
                >
                  <Input.Password
                    size="large"
                    prefix={<LockOutlined />}
                    placeholder="Minimal 6 karakter"
                  />
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={loading}
                >
                  Register
                </Button>
              </Form>
            ) : null}

            {!isRegistrationClosed ? (
              <div className="auth-footer">
                <Text type="secondary">Sudah punya akun?</Text>{" "}
                <Link href="/login">Login</Link>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </main>
  );
}
