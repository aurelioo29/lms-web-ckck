"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Space, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Check, X } from "lucide-react";

import DataTable from "@/components/shared/data-table/data-table";
import type { DataTableFilterValues } from "@/components/shared/data-table/types";

import type {
  UserApprovalItem,
  UserApprovalsResponse,
} from "../types/user-approval.type";

const emptyFilters: DataTableFilterValues = {
  search: "",
  status: "PENDING",
  createdAt: ["", ""],
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

export default function UserApprovalTable() {
  const [data, setData] = useState<UserApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [filters, setFilters] = useState<DataTableFilterValues>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<DataTableFilterValues>(emptyFilters);

  const [declineOpen, setDeclineOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] =
    useState<UserApprovalItem | null>(null);
  const [declineNote, setDeclineNote] = useState("");

  const createdAt = appliedFilters.createdAt;

  const query = useMemo(
    () =>
      buildQuery({
        page,
        limit,
        search: String(appliedFilters.search || ""),
        status: String(appliedFilters.status || ""),
        createdAtStart: Array.isArray(createdAt) ? createdAt[0] : "",
        createdAtEnd: Array.isArray(createdAt) ? createdAt[1] : "",
        sortBy,
        sortOrder,
      }),
    [page, limit, appliedFilters, createdAt, sortBy, sortOrder],
  );

  async function fetchApprovals() {
    try {
      setLoading(true);

      const res = await fetch(`/api/user-approvals?${query}`, {
        cache: "no-store",
      });

      const json: UserApprovalsResponse | { message?: string } =
        await res.json();

      if (!res.ok) {
        throw new Error(
          "message" in json ? json.message : "Gagal mengambil approval.",
        );
      }

      const response = json as UserApprovalsResponse;

      setData(response.data || []);
      setTotal(response.meta.total || 0);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  async function approveUser(id: string) {
    try {
      setLoading(true);

      const res = await fetch(`/api/user-approvals/${id}/approve`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal approve user.");
      }

      message.success(json.message || "User berhasil disetujui.");
      fetchApprovals();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  async function declineUser() {
    if (!selectedApproval) return;

    try {
      setLoading(true);

      const res = await fetch(
        `/api/user-approvals/${selectedApproval.id}/decline`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            note: declineNote,
          }),
        },
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal decline user.");
      }

      message.success(json.message || "User berhasil ditolak.");
      setDeclineOpen(false);
      setSelectedApproval(null);
      setDeclineNote("");
      fetchApprovals();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
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

    const createdAtValue = appliedFilters.createdAt;

    if (
      Array.isArray(createdAtValue) &&
      createdAtValue[0] &&
      createdAtValue[1]
    ) {
      params.push(`createdAt=${createdAtValue[0]} → ${createdAtValue[1]}`);
    }

    return params.length > 0 ? params.join(", ") : "";
  }, [appliedFilters]);

  useEffect(() => {
    fetchApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const columns: ColumnsType<UserApprovalItem> = [
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <div>
          <p className="m-0 font-semibold text-slate-900">{record.user.name}</p>
          <p className="m-0 text-xs text-slate-500">@{record.user.username}</p>
        </div>
      ),
    },
    {
      title: "Email",
      key: "email",
      dataIndex: ["user", "email"],
    },
    {
      title: "User Status",
      key: "userStatus",
      dataIndex: ["user", "status"],
      render: (status) => <Tag color="orange">{status}</Tag>,
    },
    {
      title: "Approval Status",
      key: "status",
      dataIndex: "status",
      sorter: true,
      render: (status) => <Tag color="blue">{status}</Tag>,
    },
    {
      title: "Registered At",
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
        <Space>
          <Button
            type="primary"
            icon={<Check size={14} />}
            onClick={() => approveUser(record.id)}
            disabled={record.status !== "PENDING"}
          >
            Approve
          </Button>

          <Button
            danger
            icon={<X size={14} />}
            disabled={record.status !== "PENDING"}
            onClick={() => {
              setSelectedApproval(record);
              setDeclineOpen(true);
            }}
          >
            Decline
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <DataTable<UserApprovalItem>
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
              { label: "Pending", value: "PENDING" },
              { label: "Approved", value: "APPROVED" },
              { label: "Declined", value: "DECLINED" },
            ],
          },
          {
            key: "createdAt",
            label: "Created At",
            type: "dateRange",
            placeholder: "Select date range",
          },
        ]}
        filterValues={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
        parameterText={parameterText}
        onRefresh={fetchApprovals}
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

      <Modal
        title="Decline User Registration"
        open={declineOpen}
        onCancel={() => {
          setDeclineOpen(false);
          setSelectedApproval(null);
          setDeclineNote("");
        }}
        onOk={declineUser}
        okText="Decline"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          loading,
        }}
      >
        <p className="text-sm text-slate-600">
          Berikan catatan kenapa user ini ditolak.
        </p>

        <Input.TextArea
          rows={4}
          value={declineNote}
          onChange={(event) => setDeclineNote(event.target.value)}
          placeholder="Contoh: Data belum lengkap / email tidak valid"
        />
      </Modal>
    </>
  );
}
