"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Check, ExternalLink } from "lucide-react";
import Link from "next/link";

import DataTable from "@/components/shared/data-table/data-table";
import type { DataTableFilterValues } from "@/components/shared/data-table/types";
import type { NotificationItem } from "../types/notification.type";

type NotificationsResponse = {
  data: NotificationItem[];
  unreadCount: number;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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

const emptyFilters: DataTableFilterValues = {
  isRead: "",
};

export default function NotificationsTable() {
  const [data, setData] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<DataTableFilterValues>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<DataTableFilterValues>(emptyFilters);

  const query = useMemo(
    () =>
      buildQuery({
        page,
        limit,
        isRead: String(appliedFilters.isRead || ""),
      }),
    [page, limit, appliedFilters],
  );

  async function fetchNotifications() {
    try {
      setLoading(true);

      const res = await fetch(`/api/notifications?${query}`, {
        cache: "no-store",
      });

      const json: NotificationsResponse | { message?: string } =
        await res.json();

      if (!res.ok) {
        throw new Error(
          "message" in json ? json.message : "Gagal mengambil notifications.",
        );
      }

      const response = json as NotificationsResponse;

      setData(response.data || []);
      setTotal(response.meta.total || 0);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal update notification.");
      }

      message.success("Notification ditandai sudah dibaca.");
      fetchNotifications();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    }
  }

  async function markAllAsRead() {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal update notifications.");
      }

      message.success("Semua notification ditandai sudah dibaca.");
      fetchNotifications();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
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
    if (appliedFilters.isRead === "true") return "status=read";
    if (appliedFilters.isRead === "false") return "status=unread";

    return "";
  }, [appliedFilters]);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const columns: ColumnsType<NotificationItem> = [
    {
      title: "Title",
      key: "title",
      dataIndex: "title",
      render: (value, record) => (
        <div>
          <p className="m-0 font-semibold text-slate-900">{value}</p>
          <p className="m-0 text-xs text-slate-500">{record.message}</p>
        </div>
      ),
    },
    {
      title: "Type",
      key: "type",
      dataIndex: "type",
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Status",
      key: "isRead",
      dataIndex: "isRead",
      render: (value) =>
        value ? <Tag>READ</Tag> : <Tag color="orange">UNREAD</Tag>,
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
        <div className="flex justify-center gap-2">
          {!record.isRead ? (
            <Button
              type="link"
              icon={<Check size={14} />}
              onClick={() => markAsRead(record.id)}
            />
          ) : null}

          {record.link ? (
            <Link href={record.link}>
              <Button type="link" icon={<ExternalLink size={14} />} />
            </Link>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <DataTable<NotificationItem>
      loading={loading}
      columns={columns}
      dataSource={data}
      filters={[
        {
          key: "isRead",
          label: "Status",
          type: "select",
          placeholder: "Select status",
          options: [
            { label: "Read", value: "true" },
            { label: "Unread", value: "false" },
          ],
        },
      ]}
      filterValues={filters}
      onFilterChange={handleFilterChange}
      onSearch={handleSearch}
      onReset={handleReset}
      parameterText={parameterText}
      actions={[
        {
          key: "read-all",
          label: "Mark All As Read",
          icon: <Check size={14} />,
          type: "primary",
          onClick: markAllAsRead,
        },
      ]}
      onRefresh={fetchNotifications}
      pagination={{
        page,
        limit,
        total,
        onChange: (nextPage, nextLimit) => {
          setPage(nextPage);
          setLimit(nextLimit);
        },
      }}
    />
  );
}
