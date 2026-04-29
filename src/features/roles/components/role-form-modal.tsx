"use client";

import { useEffect, useMemo, useState } from "react";
import { Form, Input, Modal, Switch, Tree, message } from "antd";
import type { TreeDataNode } from "antd";
import { DownOutlined } from "@ant-design/icons";

type PermissionItem = {
  id: string;
  name: string;
  description?: string | null;
};

type RoleItem = {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  permissions: {
    permission: PermissionItem;
  }[];
};

type RoleFormModalProps = {
  open: boolean;
  role: RoleItem | null;
  onClose: () => void;
  onSuccess: () => void;
};

type RoleFormValues = {
  name: string;
  description?: string;
  isDefault: boolean;
};

function toTitle(text: string) {
  return text
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getModuleName(permissionName: string) {
  return permissionName.split(".")[0] || "general";
}

function getActionName(permissionName: string) {
  const parts = permissionName.split(".");
  return parts.slice(1).join(".") || permissionName;
}

function buildPermissionTree(permissions: PermissionItem[]): TreeDataNode[] {
  const grouped = permissions.reduce<Record<string, PermissionItem[]>>(
    (acc, permission) => {
      const moduleName = getModuleName(permission.name);

      if (!acc[moduleName]) {
        acc[moduleName] = [];
      }

      acc[moduleName].push(permission);
      return acc;
    },
    {},
  );

  return Object.entries(grouped).map(([moduleName, items]) => ({
    title: `${toTitle(moduleName)} Menu`,
    key: `module:${moduleName}`,
    children: items.map((permission) => ({
      title: toTitle(getActionName(permission.name)),
      key: permission.id,
    })),
  }));
}

export default function RoleFormModal({
  open,
  role,
  onClose,
  onSuccess,
}: RoleFormModalProps) {
  const [form] = Form.useForm<RoleFormValues>();

  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);

  const isEdit = !!role;

  const treeData = useMemo(
    () => buildPermissionTree(permissions),
    [permissions],
  );

  const expandedKeys = useMemo(
    () => treeData.map((item) => String(item.key)),
    [treeData],
  );

  async function fetchPermissions() {
    try {
      const res = await fetch("/api/permissions/options", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal mengambil permissions.");
      }

      setPermissions(json.data || []);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    }
  }

  async function onFinish(values: RoleFormValues) {
    try {
      setSaving(true);

      const permissionIds = checkedKeys
        .map(String)
        .filter((key) => !key.startsWith("module:"));

      const res = await fetch(isEdit ? `/api/roles/${role.id}` : "/api/roles", {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description || null,
          isDefault: values.isDefault || false,
          permissionIds,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal menyimpan role.");
      }

      message.success(json.message || "Role berhasil disimpan.");
      form.resetFields();
      setCheckedKeys([]);
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

    fetchPermissions();

    if (role) {
      form.setFieldsValue({
        name: role.name,
        description: role.description || "",
        isDefault: role.isDefault,
      });

      setCheckedKeys(role.permissions.map((item) => item.permission.id));
    } else {
      form.resetFields();
      form.setFieldsValue({
        isDefault: false,
      });
      setCheckedKeys([]);
    }
  }, [open, role, form]);

  return (
    <Modal
      title={isEdit ? "Edit Role" : "Create Role"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText={isEdit ? "Update" : "Create"}
      width={900}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Form.Item
            label="Role Name"
            name="name"
            rules={[{ required: true, message: "Role name wajib diisi" }]}
          >
            <Input placeholder="Contoh: Instructor" />
          </Form.Item>

          <Form.Item
            label="Default Role"
            name="isDefault"
            valuePropName="checked"
          >
            <Switch checkedChildren="YES" unCheckedChildren="NO" />
          </Form.Item>
        </div>

        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} placeholder="Deskripsi role" />
        </Form.Item>

        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-slate-900">
            Section Access List
          </p>

          <div className="max-h-[420px] overflow-auto rounded border border-slate-200 bg-white p-4">
            <Tree
              checkable
              showLine
              defaultExpandAll
              expandedKeys={expandedKeys}
              switcherIcon={({ expanded }) => (
                <DownOutlined
                  style={{
                    transform: `rotate(${expanded ? 0 : -90}deg)`,
                    transition: "transform 0.2s",
                  }}
                />
              )}
              checkedKeys={checkedKeys}
              onCheck={(keys) => {
                if (Array.isArray(keys)) {
                  setCheckedKeys(keys);
                } else {
                  setCheckedKeys(keys.checked);
                }
              }}
              treeData={treeData}
            />
          </div>
        </div>
      </Form>
    </Modal>
  );
}
