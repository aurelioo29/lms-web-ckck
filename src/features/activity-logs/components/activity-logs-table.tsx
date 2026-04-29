"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Eye } from "lucide-react";

import DataTable from "@/components/shared/data-table/data-table";
import type { DataTableFilterValues } from "@/components/shared/data-table/types";

import ActivityLogDetailModal from "./activity-log-detail-modal";
import type {
  ActivityLogItem,
  ActivityLogsResponse,
} from "../types/activity-log.type";

const moduleOptions = [
  { label: "Auth", value: "auth" },
  { label: "Profile", value: "profile" },
  { label: "Users", value: "users" },
  { label: "User Approvals", value: "user_approvals" },
  { label: "Settings", value: "settings" },
];

const actionOptions = [
  { label: "Login", value: "LOGIN" },
  { label: "Register", value: "REGISTER" },
  { label: "Update Profile", value: "UPDATE_PROFILE" },
  { label: "Change Password", value: "CHANGE_PASSWORD" },
  { label: "Create User", value: "CREATE_USER" },
  { label: "Approve User", value: "APPROVE_USER" },
  { label: "Decline User", value: "DECLINE_USER" },
  { label: "Update Settings", value: "UPDATE_SETTINGS" },
];

function buildQuery(params: Record<string, string | number>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}

const emptyFilters: DataTableFilterValues = {
  search: "",
  module: "",
  action: "",
  createdAt: ["", ""],
};

export default function ActivityLogsTable() {
  const [data, setData] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [filters, setFilters] = useState<DataTableFilterValues>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<DataTableFilterValues>(emptyFilters);

  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  const createdAt = appliedFilters.createdAt;

  const query = useMemo(
    () =>
      buildQuery({
        page,
        limit,
        search: String(appliedFilters.search || ""),
        module: String(appliedFilters.module || ""),
        action: String(appliedFilters.action || ""),
        createdAtStart: Array.isArray(createdAt) ? createdAt[0] : "",
        createdAtEnd: Array.isArray(createdAt) ? createdAt[1] : "",
        sortBy,
        sortOrder,
      }),
    [page, limit, appliedFilters, createdAt, sortBy, sortOrder],
  );

  async function fetchLogs() {
    try {
      setLoading(true);

      const res = await fetch(`/api/activity-logs?${query}`, {
        cache: "no-store",
      });

      const json: ActivityLogsResponse | { message?: string } =
        await res.json();

      if (!res.ok) {
        throw new Error(
          "message" in json ? json.message : "Gagal mengambil logs.",
        );
      }

      const response = json as ActivityLogsResponse;

      setData(response.data || []);
      setTotal(response.meta.total || 0);
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

    if (appliedFilters.module) {
      params.push(`module=${appliedFilters.module}`);
    }

    if (appliedFilters.action) {
      params.push(`action=${appliedFilters.action}`);
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
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const columns: ColumnsType<ActivityLogItem> = [
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <div>
          <p className="m-0 font-semibold text-slate-900">
            {record.user?.name || "System"}
          </p>
          <p className="m-0 text-xs text-slate-500">
            {record.user ? `@${record.user.username}` : "-"}
          </p>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      dataIndex: "action",
      sorter: true,
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Module",
      key: "module",
      dataIndex: "module",
      sorter: true,
      render: (value) => <Tag>{value}</Tag>,
    },
    {
      title: "Description",
      key: "description",
      dataIndex: "description",
      ellipsis: true,
      render: (value) => value || "-",
    },
    {
      title: "IP Address",
      key: "ipAddress",
      dataIndex: "ipAddress",
      render: (value) => value || "-",
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
        <Button
          type="link"
          icon={<Eye size={14} />}
          onClick={() => setSelectedLog(record)}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable<ActivityLogItem>
        loading={loading}
        columns={columns}
        dataSource={data}
        filters={[
          {
            key: "search",
            label: "Search",
            type: "input",
            placeholder: "Search action, module, description",
          },
          {
            key: "module",
            label: "Module",
            type: "select",
            placeholder: "Select module",
            options: moduleOptions,
          },
          {
            key: "action",
            label: "Action",
            type: "select",
            placeholder: "Select action",
            options: actionOptions,
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
        onRefresh={fetchLogs}
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

      <ActivityLogDetailModal
        open={!!selectedLog}
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </>
  );
}
