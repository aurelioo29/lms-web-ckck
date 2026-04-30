"use client";

import { useEffect, useState } from "react";
import { Avatar, Card, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { Crown, Medal, Trophy } from "lucide-react";

import type { LeaderboardItem } from "../types/point.type";

type LeaderboardResponse = {
  data: LeaderboardItem[];
  myRank: LeaderboardItem | null;
};

function getInitial(name: string) {
  return name?.trim()?.charAt(0)?.toUpperCase() || "U";
}

function getRankBadge(rank: number) {
  if (rank === 1) return <Tag color="gold">#1 Champion</Tag>;
  if (rank === 2) return <Tag color="blue">#2 Runner Up</Tag>;
  if (rank === 3) return <Tag color="purple">#3 Third Place</Tag>;

  return <Tag>#{rank}</Tag>;
}

export default function LeaderboardTable() {
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardItem | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchLeaderboard() {
    try {
      setLoading(true);

      const res = await fetch("/api/leaderboard", {
        cache: "no-store",
      });

      const json: LeaderboardResponse | { message?: string } = await res.json();

      if (!res.ok) {
        throw new Error(
          "message" in json ? json.message : "Gagal mengambil leaderboard.",
        );
      }

      const response = json as LeaderboardResponse;

      setData(response.data || []);
      setMyRank(response.myRank);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const columns: ColumnsType<LeaderboardItem> = [
    {
      title: "Rank",
      dataIndex: "rank",
      width: 140,
      render: (rank) => getRankBadge(rank),
    },
    {
      title: "User",
      key: "user",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar || undefined}>
            {getInitial(record.name)}
          </Avatar>

          <div>
            <p className="m-0 font-semibold text-slate-900">{record.name}</p>
            <p className="m-0 text-xs text-slate-500">@{record.username}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Total Points",
      dataIndex: "totalPoints",
      align: "right",
      render: (value) => (
        <span className="font-bold text-blue-600">{value} pts</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
            <Trophy size={24} />
          </div>

          <div>
            <p className="m-0 text-sm text-slate-500">Your Rank</p>
            <p className="m-0 text-xl font-bold text-slate-900">
              {myRank ? `#${myRank.rank} — ${myRank.totalPoints} pts` : "-"}
            </p>
          </div>
        </div>
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Crown size={18} />
            Leaderboard
          </div>
        }
      >
        <Table
          rowKey="userId"
          loading={loading}
          columns={columns}
          dataSource={data}
          bordered
          pagination={{
            pageSize: 10,
          }}
          rowClassName={(record) =>
            record.userId === myRank?.userId ? "bg-blue-50" : ""
          }
        />
      </Card>
    </div>
  );
}
