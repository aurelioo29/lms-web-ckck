"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Modal, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Edit, KeyRound, Plus, Trash2 } from "lucide-react";

import DataTable from "@/components/shared/data-table/data-table";
import type { DataTableFilterValues } from "@/components/shared/data-table/types";

import UserFormModal from "./user-form-modal";
import type { RoleOption, UserItem, UsersResponse } from "../types/user.type";

const emptyFilters: DataTableFilterValues = {
  search: "",
  status: "",
  roleId: "",
};

function buildQuery(params: Record<string, string | number>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}

function getStatusColor(status: string) {
  if (status === "ACTIVE") return "green";
  if (status === "PENDING") return "orange";
  if (status === "SUSPENDED") return "red";
  if (status === "DECLINED") return "volcano";

  return "default";
}

export default function UsersTable() {
  const [modal, contextHolder] = Modal.useModal();

  const [data, setData] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [filters, setFilters] = useState<DataTableFilterValues>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<DataTableFilterValues>(emptyFilters);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const query = useMemo(
    () =>
      buildQuery({
        page,
        limit,
        search: String(appliedFilters.search || ""),
        status: String(appliedFilters.status || ""),
        roleId: String(appliedFilters.roleId || ""),
        sortBy,
        sortOrder,
      }),
    [page, limit, appliedFilters, sortBy, sortOrder],
  );

  async function fetchUsers() {
    try {
      setLoading(true);

      const res = await fetch(`/api/users?${query}`, {
        cache: "no-store",
      });

      const json: UsersResponse | { message?: string } = await res.json();

      if (!res.ok) {
        throw new Error(
          "message" in json ? json.message : "Gagal mengambil users.",
        );
      }

      const response = json as UsersResponse;

      setData(response.data || []);
      setTotal(response.meta.total || 0);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

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

  async function deleteUser(user: UserItem) {
    modal.confirm({
      title: "Delete user?",
      content: `User ${user.name} akan dihapus. Ini bukan tombol dekorasi, datanya hilang.`,
      okText: "Delete",
      cancelText: "Cancel",
      okButtonProps: {
        danger: true,
      },
      async onOk() {
        const res = await fetch(`/api/users/${user.id}`, {
          method: "DELETE",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Gagal menghapus user.");
        }

        message.success(json.message || "User berhasil dihapus.");
        fetchUsers();
      },
    });
  }

  async function resetPassword(user: UserItem) {
    modal.confirm({
      title: "Reset password?",
      content: `Password ${user.name} akan direset ke: Password123`,
      okText: "Reset",
      cancelText: "Cancel",
      async onOk() {
        const res = await fetch(`/api/users/${user.id}/reset-password`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: "Password123",
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || "Gagal reset password.");
        }

        message.success(json.message || "Password berhasil direset.");
      },
    });
  }

  function handleFilterChange(key: string, value: string | [string, string]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSearch() {
    setAppliedFilters({ ...filters });
    setPage(1);
  }

  function handleReset() {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  }

  const parameterText = useMemo(() => {
    const params: string[] = [];

    if (appliedFilters.search) {
      params.push(`search=${appliedFilters.search}`);
    }

    if (appliedFilters.status) {
      params.push(`status=${appliedFilters.status}`);
    }

    if (appliedFilters.roleId) {
      const role = roles.find((item) => item.id === appliedFilters.roleId);
      params.push(`role=${role?.name || appliedFilters.roleId}`);
    }

    return params.length > 0 ? params.join(", ") : "";
  }, [appliedFilters, roles]);

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const columns: ColumnsType<UserItem> = [
    {
      title: "User",
      key: "name",
      sorter: true,
      render: (_, record) => (
        <div>
          <p className="m-0 font-semibold text-slate-900">{record.name}</p>
          <p className="m-0 text-xs text-slate-500">@{record.username}</p>
        </div>
      ),
    },
    {
      title: "Email",
      key: "email",
      dataIndex: "email",
      sorter: true,
    },
    {
      title: "Roles",
      key: "roles",
      render: (_, record) =>
        record.roles.length > 0
          ? record.roles.map((item) => (
              <Tag key={item.role.id} color="blue">
                {item.role.name}
              </Tag>
            ))
          : "-",
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      sorter: true,
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: "Created At",
      key: "createdAt",
      dataIndex: "createdAt",
      sorter: true,
      render: (value) => new Date(value).toLocaleString("id-ID"),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <div className="flex justify-center gap-1">
          <Button
            type="link"
            icon={<Edit size={14} />}
            onClick={() => {
              setSelectedUser(record);
              setFormOpen(true);
            }}
          />

          <Button
            type="link"
            icon={<KeyRound size={14} />}
            onClick={() => resetPassword(record)}
          />

          <Button
            type="link"
            danger
            icon={<Trash2 size={14} />}
            onClick={() => deleteUser(record)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {contextHolder}

      <DataTable<UserItem>
        loading={loading}
        columns={columns}
        dataSource={data}
        filters={[
          {
            key: "search",
            label: "Search",
            type: "input",
            placeholder: "Search name, username, email",
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            placeholder: "Select status",
            options: [
              { label: "Active", value: "ACTIVE" },
              { label: "Pending", value: "PENDING" },
              { label: "Inactive", value: "INACTIVE" },
              { label: "Suspended", value: "SUSPENDED" },
              { label: "Declined", value: "DECLINED" },
            ],
          },
          {
            key: "roleId",
            label: "Role",
            type: "select",
            placeholder: "Select role",
            options: roles.map((role) => ({
              label: role.name,
              value: role.id,
            })),
          },
        ]}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
        parameterText={parameterText}
        actions={[
          {
            key: "create",
            label: "Tambah User",
            type: "primary",
            icon: <Plus size={14} />,
            onClick: () => {
              setSelectedUser(null);
              setFormOpen(true);
            },
          },
        ]}
        onRefresh={fetchUsers}
        pagination={{
          page,
          limit,
          total,
          onChange: (nextPage, nextLimit) => {
            setPage(nextPage);
            setLimit(nextLimit);
          },
        }}
        onSortChange={(sort) => {
          if (!sort.field || !sort.order) {
            setSortBy("createdAt");
            setSortOrder("desc");
            return;
          }

          setSortBy(sort.field);
          setSortOrder(sort.order === "ascend" ? "asc" : "desc");
          setPage(1);
        }}
      />

      <UserFormModal
        open={formOpen}
        user={selectedUser}
        onClose={() => {
          setFormOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchUsers}
      />
    </>
  );
}
