"use client";

import { useEffect, useState } from "react";
import { Button, message, Modal, Tag } from "antd";
import { Plus, Trash2, Edit } from "lucide-react";

import DataTable from "@/components/shared/data-table/data-table";
import RoleFormModal from "./role-form-modal";

export default function RolesTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  async function fetchRoles() {
    setLoading(true);
    const res = await fetch("/api/roles");
    const json = await res.json();
    setData(json.data || []);
    setLoading(false);
  }

  async function deleteRole(role: any) {
    Modal.confirm({
      title: "Delete role?",
      content: role.name,
      onOk: async () => {
        const res = await fetch(`/api/roles/${role.id}`, {
          method: "DELETE",
        });

        const json = await res.json();

        if (!res.ok) {
          message.error(json.message);
          return;
        }

        message.success(json.message);
        fetchRoles();
      },
    });
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <>
      <DataTable
        loading={loading}
        columns={[
          {
            title: "Name",
            dataIndex: "name",
          },
          {
            title: "Default",
            render: (_: any, r: any) =>
              r.isDefault ? <Tag color="green">DEFAULT</Tag> : "-",
          },
          {
            title: "Actions",
            render: (_: any, r: any) => (
              <div className="flex gap-1">
                <Button
                  type="link"
                  icon={<Edit size={14} />}
                  onClick={() => {
                    setSelected(r);
                    setOpen(true);
                  }}
                />

                <Button
                  type="link"
                  danger
                  icon={<Trash2 size={14} />}
                  onClick={() => deleteRole(r)}
                />
              </div>
            ),
          },
        ]}
        dataSource={data}
        pagination={{
          page: 1,
          limit: 10,
          total: data.length,
          onChange: () => {},
        }}
        onRefresh={fetchRoles}
        actions={[
          {
            key: "create",
            label: "Tambah Role",
            type: "primary",
            icon: <Plus size={14} />,
            onClick: () => {
              setSelected(null);
              setOpen(true);
            },
          },
        ]}
      />

      <RoleFormModal
        open={open}
        role={selected}
        onClose={() => setOpen(false)}
        onSuccess={fetchRoles}
      />
    </>
  );
}
