"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Empty, Popover, Spin, message } from "antd";
import { Bell, CheckCheck } from "lucide-react";

import type { NotificationItem } from "../types/notification.type";

export default function NotificationPopover() {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  async function fetchNotifications() {
    try {
      setLoading(true);

      const res = await fetch("/api/notifications?limit=5", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengambil notification.");
      }

      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function markAllAsRead() {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal update notification.");
      }

      message.success("Semua notification ditandai sudah dibaca.");
      fetchNotifications();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Terjadi error.");
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  const content = (
    <div className="w-[320px]">
      <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
        <div>
          <p className="m-0 text-sm font-semibold text-slate-900">
            Notifications
          </p>
          <p className="m-0 text-xs text-slate-500">
            {unreadCount} unread notification
          </p>
        </div>

        <Button
          type="text"
          size="small"
          icon={<CheckCheck size={14} />}
          onClick={markAllAsRead}
        >
          Read all
        </Button>
      </div>

      {loading ? (
        <div className="flex h-28 items-center justify-center">
          <Spin />
        </div>
      ) : notifications.length === 0 ? (
        <Empty
          description="Belum ada notification"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div className="max-h-[320px] space-y-2 overflow-y-auto">
          {notifications.map((item) => {
            const card = (
              <div
                className={[
                  "rounded-md border p-3 transition hover:bg-slate-50",
                  item.isRead
                    ? "border-slate-100 bg-white"
                    : "border-blue-100 bg-blue-50",
                ].join(" ")}
              >
                <p className="m-0 text-sm font-semibold text-slate-900">
                  {item.title}
                </p>

                <p className="m-0 mt-1 text-xs text-slate-600">
                  {item.message}
                </p>
              </div>
            );

            return item.link ? (
              <Link key={item.id} href={item.link}>
                {card}
              </Link>
            ) : (
              <div key={item.id}>{card}</div>
            );
          })}
        </div>
      )}

      <div className="mt-3 border-t border-slate-100 pt-2">
        <Link
          href="/dashboard/notifications"
          className="block text-center text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      content={content}
      onOpenChange={(open) => {
        if (open) fetchNotifications();
      }}
    >
      <Badge count={unreadCount} size="small">
        <Button
          shape="circle"
          className="inline-flex items-center justify-center"
          icon={<Bell size={16} />}
        />
      </Badge>
    </Popover>
  );
}
