"use client";

import { useEffect, useState } from "react";
import { Card, Statistic, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowDown, ArrowUp, Trophy } from "lucide-react";

import type { PointTransactionItem } from "../types/point.type";

type PointsResponse = {
  data: PointTransactionItem[];
  summary: {
    totalPoints: number;
    totalEarned: number;
    totalDeducted: number;
  };
};

export default function PointsHistory() {
  const [data, setData] = useState<PointTransactionItem[]>([]);
  const [summary, setSummary] = useState({
    totalPoints: 0,
    totalEarned: 0,
    totalDeducted: 0,
  });
  const [loading, setLoading] = useState(false);

  async function fetchPoints() {
    try {
      setLoading(true);

      const res = await fetch("/api/points/history", {
        cache: "no-store",
      });

      const json: PointsResponse | { message?: string } = await res.json();

      if (!res.ok) {
        throw new Error(
          "message" in json ? json.message : "Gagal mengambil points.",
        );
      }

      const response = json as PointsResponse;

      setData(response.data || []);
      setSummary(response.summary);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPoints();
  }, []);

  const columns: ColumnsType<PointTransactionItem> = [
    {
      title: "Type",
      dataIndex: "type",
      render: (value) =>
        value === "EARNED" ? (
          <Tag color="green" icon={<ArrowUp size={12} />}>
            EARNED
          </Tag>
        ) : (
          <Tag color="red" icon={<ArrowDown size={12} />}>
            DEDUCTED
          </Tag>
        ),
    },
    {
      title: "Points",
      dataIndex: "points",
      render: (value, record) => (
        <span
          className={
            record.type === "EARNED"
              ? "font-semibold text-green-600"
              : "font-semibold text-red-600"
          }
        >
          {record.type === "EARNED" ? "+" : "-"}
          {value}
        </span>
      ),
    },
    {
      title: "Source",
      dataIndex: "source",
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (value) => value || "-",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      render: (value) => new Date(value).toLocaleString("id-ID"),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <Statistic
            title="Total Points"
            value={summary.totalPoints}
            prefix={<Trophy size={18} />}
          />
        </Card>

        <Card>
          <Statistic
            title="Earned"
            value={summary.totalEarned}
            valueStyle={{ color: "#16a34a" }}
          />
        </Card>

        <Card>
          <Statistic
            title="Deducted"
            value={summary.totalDeducted}
            valueStyle={{ color: "#dc2626" }}
          />
        </Card>
      </div>

      <Card title="Point History">
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          bordered
          pagination={{
            pageSize: 10,
          }}
        />
      </Card>
    </div>
  );
}
