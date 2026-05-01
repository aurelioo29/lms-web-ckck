import Link from "next/link";
import { Card, Col, Progress, Row, Statistic, Tag } from "antd";
import {
  Activity,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Trophy,
  Users,
} from "lucide-react";

import { requirePermission } from "@/lib/require-permission";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  await requirePermission("dashboard.view");

  const [
    totalUsers,
    activeUsers,
    pendingApprovals,
    totalCourses,
    publishedCourses,
    totalEnrollments,
    completedEnrollments,
    unreadNotifications,
    activityLogs,
    totalPoints,
    recentActivities,
    recentNotifications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { status: "ACTIVE" },
    }),
    prisma.userApproval.count({
      where: { status: "PENDING" },
    }),
    prisma.course.count(),
    prisma.course.count({
      where: { status: "PUBLISHED" },
    }),
    prisma.enrollment.count(),
    prisma.enrollment.count({
      where: { status: "COMPLETED" },
    }),
    prisma.notification.count({
      where: { isRead: false },
    }),
    prisma.activityLog.count(),
    prisma.pointTransaction.aggregate({
      _sum: {
        points: true,
      },
    }),
    prisma.activityLog.findMany({
      take: 6,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    }),
    prisma.notification.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    }),
  ]);

  const enrollmentCompletionRate =
    totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

  const publishedCourseRate =
    totalCourses > 0 ? Math.round((publishedCourses / totalCourses) * 100) : 0;

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h3 className="mb-1 text-2xl font-bold text-slate-900">Dashboard</h3>
          <p className="text-sm text-slate-500">
            Ringkasan sistem LMS. Data nggak akan bohong, kecuali seed kamu
            sedang cosplay jadi production.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/courses"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Manage Courses
          </Link>

          <Link
            href="/dashboard/users"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Manage Users
          </Link>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card className="h-full">
            <div className="flex items-start justify-between">
              <Statistic title="Total Users" value={totalUsers} />
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Users size={20} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Active users:{" "}
              <span className="font-semibold text-slate-700">
                {activeUsers}
              </span>
            </p>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={6}>
          <Card className="h-full">
            <div className="flex items-start justify-between">
              <Statistic title="Pending Approval" value={pendingApprovals} />
              <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                <Clock size={20} />
              </div>
            </div>
            <Link
              href="/dashboard/user-approvals"
              className="mt-3 block text-xs font-medium text-blue-600"
            >
              Review pending users
            </Link>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={6}>
          <Card className="h-full">
            <div className="flex items-start justify-between">
              <Statistic title="Published Courses" value={publishedCourses} />
              <div className="rounded-lg bg-green-50 p-2 text-green-600">
                <BookOpen size={20} />
              </div>
            </div>
            <div className="mt-3">
              <Progress percent={publishedCourseRate} size="small" />
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={6}>
          <Card className="h-full">
            <div className="flex items-start justify-between">
              <Statistic
                title="Total Points"
                value={totalPoints._sum.points || 0}
              />
              <div className="rounded-lg bg-yellow-50 p-2 text-yellow-600">
                <Trophy size={20} />
              </div>
            </div>
            <Link
              href="/dashboard/leaderboard"
              className="mt-3 block text-xs font-medium text-blue-600"
            >
              View leaderboard
            </Link>
          </Card>
        </Col>
      </Row>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Learning Overview">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <GraduationCap size={16} />
                Courses
              </div>
              <p className="m-0 text-2xl font-bold text-slate-900">
                {totalCourses}
              </p>
              <p className="m-0 text-xs text-slate-500">
                {publishedCourses} published
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <CheckCircle2 size={16} />
                Enrollments
              </div>
              <p className="m-0 text-2xl font-bold text-slate-900">
                {totalEnrollments}
              </p>
              <p className="m-0 text-xs text-slate-500">
                {completedEnrollments} completed
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Activity size={16} />
                Activity Logs
              </div>
              <p className="m-0 text-2xl font-bold text-slate-900">
                {activityLogs}
              </p>
              <p className="m-0 text-xs text-slate-500">Total system logs</p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                Enrollment Completion
              </span>
              <span className="text-slate-500">
                {completedEnrollments}/{totalEnrollments}
              </span>
            </div>

            <Progress percent={enrollmentCompletionRate} />
          </div>
        </Card>

        <Card title="Notifications">
          <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-blue-600" />
              <span className="text-sm font-semibold text-slate-700">
                Unread
              </span>
            </div>

            <Tag color={unreadNotifications > 0 ? "red" : "green"}>
              {unreadNotifications}
            </Tag>
          </div>

          <div className="space-y-3">
            {recentNotifications.length === 0 ? (
              <p className="m-0 text-sm text-slate-500">
                Belum ada notification.
              </p>
            ) : (
              recentNotifications.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="m-0 truncate text-sm font-semibold text-slate-900">
                      {item.title}
                    </p>
                    <Tag color={item.isRead ? "default" : "blue"}>
                      {item.isRead ? "READ" : "NEW"}
                    </Tag>
                  </div>

                  <p className="m-0 line-clamp-2 text-xs text-slate-500">
                    {item.message}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Recent Activities">
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="m-0 text-sm text-slate-500">
                Belum ada activity log.
              </p>
            ) : (
              recentActivities.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <div className="mt-1 rounded-full bg-blue-50 p-2 text-blue-600">
                    <Activity size={15} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Tag color="blue">{item.action}</Tag>
                      <Tag>{item.module}</Tag>
                    </div>

                    <p className="m-0 text-sm text-slate-700">
                      {item.description || "-"}
                    </p>

                    <p className="m-0 mt-1 text-xs text-slate-400">
                      {item.user
                        ? `${item.user.name} (@${item.user.username})`
                        : "System"}{" "}
                      • {new Date(item.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            href="/dashboard/activity-logs"
            className="mt-4 block text-sm font-medium text-blue-600"
          >
            View all activity logs
          </Link>
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-2">
            <Link
              href="/dashboard/courses"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <span>Manage Courses</span>
              <BookOpen size={16} />
            </Link>

            <Link
              href="/dashboard/users"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <span>Manage Users</span>
              <Users size={16} />
            </Link>

            <Link
              href="/dashboard/user-approvals"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <span>User Approval</span>
              <Clock size={16} />
            </Link>

            <Link
              href="/dashboard/points"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <span>My Points</span>
              <Trophy size={16} />
            </Link>

            <Link
              href="/dashboard/settings"
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <span>General Settings</span>
              <Activity size={16} />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
