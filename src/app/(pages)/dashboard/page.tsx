import { Activity, Bell, ClipboardCheck, Users } from "lucide-react";

import { requirePermission } from "@/lib/require-permission";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  await requirePermission("dashboard.view");

  const [users, pendingApprovals, notifications, activityLogs] =
    await Promise.all([
      prisma.user.count(),
      prisma.userApproval.count({
        where: { status: "PENDING" },
      }),
      prisma.notification.count({
        where: { isRead: false },
      }),
      prisma.activityLog.count(),
    ]);

  const stats = [
    {
      title: "Total Users",
      value: users,
      icon: Users,
    },
    {
      title: "Pending Approval",
      value: pendingApprovals,
      icon: ClipboardCheck,
    },
    {
      title: "Unread Notifications",
      value: notifications,
      icon: Bell,
    },
    {
      title: "Activity Logs",
      value: activityLogs,
      icon: Activity,
    },
  ];

  return (
    <div>
      <div className="mb-5">
        <h3 className="mb-1 text-2xl font-bold text-slate-900">Dashboard</h3>
        <p className="text-sm text-slate-500">
          Ringkasan sistem LMS. Angka-angka ini tidak bohong, kecuali seed kamu
          nakal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">{stat.title}</p>
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600">
                  <Icon size={18} />
                </div>
              </div>

              <p className="text-3xl font-semibold text-slate-900">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
