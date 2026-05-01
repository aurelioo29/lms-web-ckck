"use client";

import { useEffect, useState } from "react";
import { Button, Card, Form, Input, Spin, Typography, message } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const { Title, Text } = Typography;

type LoginFormValues = {
  username: string;
  password: string;
};

type PublicSettings = {
  siteName: string;
  siteDescription: string;
  allowRegistration: boolean;
  approvalRequired: boolean;
  maintenanceMode: boolean;
};

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settings, setSettings] = useState<PublicSettings | null>(null);

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

  async function onFinish(values: LoginFormValues) {
    setLoading(true);
    message.destroy();

    try {
      const result = await signIn("credentials", {
        username: values.username,
        password: values.password,
        redirect: false,
        callbackUrl,
      });

      if (!result || result.error || result.ok !== true) {
        const errorCode = result?.code || result?.error;

        if (errorCode === "maintenance") {
          message.warning(
            "Sistem sedang maintenance. Hanya Superadmin yang bisa login sementara.",
          );

          router.push("/maintenance");
          return;
        }

        message.error("Username atau password salah.");
        return;
      }

      message.success("Login berhasil.");

      router.replace(result.url || callbackUrl || "/dashboard");
      router.refresh();
    } catch {
      message.error("Login gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPublicSettings();
  }, []);

  return (
    <main className="auth-page">
      <Card className="auth-card">
        {settingsLoading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <Spin />
          </div>
        ) : (
          <>
            <div className="auth-header">
              <Title level={2} className="auth-title">
                Login LMS
              </Title>

              <Text type="secondary">
                Masuk pakai username dan password. Email sudah cuti.
              </Text>
            </div>

            {settings?.maintenanceMode ? (
              <div className="maintenance-card">
                <div className="maintenance-icon">!</div>

                <div className="maintenance-content">
                  <div className="maintenance-badge">Maintenance Mode</div>

                  <div className="maintenance-title">
                    Sistem sedang dalam pemeliharaan
                  </div>

                  <div className="maintenance-description">
                    Untuk sementara, hanya Superadmin yang dapat masuk ke
                    sistem. Silakan coba kembali setelah proses maintenance
                    selesai.
                  </div>
                </div>
              </div>
            ) : null}

            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  {
                    required: true,
                    message: "Username wajib diisi",
                  },
                ]}
              >
                <Input
                  size="large"
                  prefix={<UserOutlined />}
                  placeholder="superadmin"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  {
                    required: true,
                    message: "Password wajib diisi",
                  },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<LockOutlined />}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                Login
              </Button>
            </Form>

            <div className="auth-footer">
              <Text type="secondary">Belum punya akun?</Text>{" "}
              <Link href="/register">Register</Link>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}
