"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Select, Switch, message } from "antd";
import { Save } from "lucide-react";

import type { SettingItem, SettingsResponse } from "../types/setting.type";

type GeneralSettingsFormValues = {
  site_name: string;
  site_description: string;
  allow_registration: boolean;
  approval_required: boolean;
  maintenance_mode: boolean;
  default_user_role: string;
  timezone: string;
};

function getSettingValue(settings: SettingItem[], key: string, fallback = "") {
  return settings.find((setting) => setting.key === key)?.value ?? fallback;
}

function getBooleanSettingValue(
  settings: SettingItem[],
  key: string,
  fallback = false,
) {
  const value = settings.find((setting) => setting.key === key)?.value;

  if (value === undefined) return fallback;

  return value === "true";
}

export default function GeneralSettingsForm() {
  const [form] = Form.useForm<GeneralSettingsFormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchSettings() {
    try {
      setLoading(true);

      const res = await fetch("/api/settings", {
        cache: "no-store",
      });

      const json: SettingsResponse | { message?: string } = await res.json();

      if (!res.ok) {
        throw new Error(
          "message" in json ? json.message : "Gagal mengambil settings.",
        );
      }

      const response = json as SettingsResponse;
      const settings = response.data || [];

      form.setFieldsValue({
        site_name: getSettingValue(settings, "site_name", "CKCK LMS"),
        site_description: getSettingValue(
          settings,
          "site_description",
          "Learning Management System",
        ),
        allow_registration: getBooleanSettingValue(
          settings,
          "allow_registration",
          true,
        ),
        approval_required: getBooleanSettingValue(
          settings,
          "approval_required",
          true,
        ),
        maintenance_mode: getBooleanSettingValue(
          settings,
          "maintenance_mode",
          false,
        ),
        default_user_role: getSettingValue(
          settings,
          "default_user_role",
          "STUDENT",
        ),
        timezone: getSettingValue(settings, "timezone", "Asia/Jakarta"),
      });
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  async function onFinish(values: GeneralSettingsFormValues) {
    try {
      setSaving(true);

      const payload = {
        settings: [
          {
            key: "site_name",
            value: values.site_name,
            type: "string",
            description: "Website name",
          },
          {
            key: "site_description",
            value: values.site_description,
            type: "string",
            description: "Website description",
          },
          {
            key: "allow_registration",
            value: String(values.allow_registration),
            type: "boolean",
            description: "Allow public registration",
          },
          {
            key: "approval_required",
            value: String(values.approval_required),
            type: "boolean",
            description: "User registration requires approval",
          },
          {
            key: "maintenance_mode",
            value: String(values.maintenance_mode),
            type: "boolean",
            description: "Enable maintenance mode",
          },
          {
            key: "default_user_role",
            value: values.default_user_role,
            type: "string",
            description: "Default role after approval",
          },
          {
            key: "timezone",
            value: values.timezone,
            type: "string",
            description: "Application timezone",
          },
        ],
      };

      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal update settings.");
      }

      message.success(json.message || "Settings berhasil diperbarui.");
      fetchSettings();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleOptions = useMemo(
    () => [
      {
        label: "Student",
        value: "STUDENT",
      },
      {
        label: "Instructor",
        value: "INSTRUCTOR",
      },
      {
        label: "Admin",
        value: "ADMIN",
      },
    ],
    [],
  );

  return (
    <Card loading={loading}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Form.Item
            label="Site Name"
            name="site_name"
            rules={[{ required: true, message: "Site name wajib diisi" }]}
          >
            <Input placeholder="CKCK LMS" />
          </Form.Item>

          <Form.Item
            label="Timezone"
            name="timezone"
            rules={[{ required: true, message: "Timezone wajib diisi" }]}
          >
            <Select
              options={[
                { label: "Asia/Jakarta", value: "Asia/Jakarta" },
                { label: "Asia/Makassar", value: "Asia/Makassar" },
                { label: "Asia/Jayapura", value: "Asia/Jayapura" },
                { label: "UTC", value: "UTC" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Default User Role"
            name="default_user_role"
            rules={[
              { required: true, message: "Default user role wajib diisi" },
            ]}
          >
            <Select options={roleOptions} />
          </Form.Item>

          <Form.Item label="Site Description" name="site_description">
            <Input placeholder="Learning Management System" />
          </Form.Item>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Form.Item
            label="Allow Registration"
            name="allow_registration"
            valuePropName="checked"
          >
            <Switch checkedChildren="ON" unCheckedChildren="OFF" />
          </Form.Item>

          <Form.Item
            label="Approval Required"
            name="approval_required"
            valuePropName="checked"
          >
            <Switch checkedChildren="ON" unCheckedChildren="OFF" />
          </Form.Item>

          <Form.Item
            label="Maintenance Mode"
            name="maintenance_mode"
            valuePropName="checked"
          >
            <Switch checkedChildren="ON" unCheckedChildren="OFF" />
          </Form.Item>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="primary"
            htmlType="submit"
            loading={saving}
            icon={<Save size={14} />}
          >
            Save Settings
          </Button>
        </div>
      </Form>
    </Card>
  );
}
