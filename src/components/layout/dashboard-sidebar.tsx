"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  LibraryBig,
  Trophy,
  Star,
} from "lucide-react";

type DashboardSidebarProps = {
  permissions: string[];
};

type SidebarChild = {
  title: string;
  href: string;
  icon: React.ElementType;
  show?: boolean;
};

type SidebarGroup = {
  title: string;
  href?: string;
  icon: React.ElementType;
  show?: boolean;
  children?: SidebarChild[];
};

function can(permissions: string[], permission: string) {
  return permissions.includes(permission);
}

export default function DashboardSidebar({
  permissions,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const groups: SidebarGroup[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      show: can(permissions, "dashboard.view"),
    },
    {
      title: "User Management",
      icon: Users,
      show:
        can(permissions, "users.view") ||
        can(permissions, "user_approvals.view"),
      children: [
        {
          title: "Users",
          href: "/dashboard/users",
          icon: ShieldCheck,
          show: can(permissions, "users.view"),
        },
        {
          title: "User Approval",
          href: "/dashboard/user-approvals",
          icon: ClipboardCheck,
          show: can(permissions, "user_approvals.view"),
        },
      ],
    },
    {
      title: "Learning",
      icon: GraduationCap,
      show:
        can(permissions, "courses.view") || can(permissions, "lessons.view"),
      children: [
        {
          title: "Courses",
          href: "/dashboard/courses",
          icon: BookOpen,
          show: can(permissions, "courses.view"),
        },
        {
          title: "My Courses",
          href: "/dashboard/my-courses",
          icon: LibraryBig,
          show: true,
        },
        {
          title: "My Points",
          href: "/dashboard/points",
          icon: Star,
          show: true,
        },
        {
          title: "Leaderboard",
          href: "/dashboard/leaderboard",
          icon: Trophy,
          show: true,
        },
      ],
    },
    {
      title: "Audit",
      icon: Activity,
      show: can(permissions, "activity_logs.view"),
      children: [
        {
          title: "Activity Logs",
          href: "/dashboard/activity-logs",
          icon: FileText,
          show: can(permissions, "activity_logs.view"),
        },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      show: can(permissions, "notifications.view"),
      children: [
        {
          title: "Notifications",
          href: "/dashboard/notifications",
          icon: Bell,
          show: can(permissions, "notifications.view"),
        },
      ],
    },
    {
      title: "System",
      icon: Settings,
      show: can(permissions, "settings.view") || can(permissions, "roles.view"),
      children: [
        {
          title: "Roles",
          href: "/dashboard/roles",
          icon: UserCog,
          show: can(permissions, "roles.view"),
        },
        {
          title: "General Settings",
          href: "/dashboard/settings",
          icon: Settings,
          show: can(permissions, "settings.view"),
        },
      ],
    },
  ];

  const visibleGroups = groups.filter((group) => group.show !== false);

  return (
    <aside
      className={[
        "sticky top-0 z-40 flex h-screen shrink-0 flex-col bg-[#062b4f] text-white transition-all duration-200",
        collapsed ? "w-16 overflow-visible" : "w-[220px] overflow-hidden",
      ].join(" ")}
    >
      <div className="flex h-12 shrink-0 items-center px-3 text-sm font-bold">
        <span className="truncate">{collapsed ? "CK" : "CKCK LMS"}</span>
      </div>

      <nav
        className={[
          "min-h-0 flex-1",
          collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden",
        ].join(" ")}
      >
        {visibleGroups.map((group) => {
          const GroupIcon = group.icon;
          const children =
            group.children?.filter((child) => child.show !== false) || [];

          if (group.href) {
            const active = pathname === group.href;

            return (
              <Link
                key={group.title}
                href={group.href}
                className={[
                  "flex h-9 items-center gap-3 px-4 text-[13px] text-white/85 transition hover:bg-[#0a3a68] hover:text-white",
                  active ? "bg-[#1677ff] text-white" : "",
                  collapsed ? "justify-center px-0" : "",
                ].join(" ")}
                title={collapsed ? group.title : undefined}
              >
                <GroupIcon size={15} className="shrink-0" />

                {!collapsed ? (
                  <span className="truncate">{group.title}</span>
                ) : null}
              </Link>
            );
          }

          return (
            <div key={group.title} className="group relative">
              <div
                className={[
                  "flex h-9 items-center gap-3 px-4 text-[13px] text-white/85 transition hover:bg-[#0a3a68] hover:text-white",
                  collapsed ? "justify-center px-0" : "",
                ].join(" ")}
                title={collapsed ? group.title : undefined}
              >
                <GroupIcon size={15} className="shrink-0" />

                {!collapsed ? (
                  <>
                    <span className="min-w-0 flex-1 truncate">
                      {group.title}
                    </span>
                    <ChevronDown size={13} className="shrink-0 text-white/70" />
                  </>
                ) : null}
              </div>

              {!collapsed
                ? children.map((child) => {
                    const ChildIcon = child.icon;
                    const active = pathname === child.href;

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={[
                          "flex h-9 items-center gap-3 px-4 pl-8 text-[13px] text-white/80 transition hover:bg-[#0a3a68] hover:text-white",
                          active ? "bg-[#1677ff] text-white" : "",
                        ].join(" ")}
                      >
                        <ChildIcon size={14} className="shrink-0" />
                        <span className="truncate">{child.title}</span>
                      </Link>
                    );
                  })
                : null}

              {collapsed && children.length > 0 ? (
                <div className="invisible absolute left-full top-0 z-50 min-w-[190px] rounded-md bg-[#031c34] py-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                  <div className="border-b border-white/10 px-3 pb-2 text-xs font-semibold text-white">
                    {group.title}
                  </div>

                  <div className="pt-1">
                    {children.map((child) => {
                      const ChildIcon = child.icon;
                      const active = pathname === child.href;

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={[
                            "flex h-9 items-center gap-2 px-3 text-xs text-white/80 transition hover:bg-[#0a3a68] hover:text-white",
                            active ? "bg-[#1677ff] text-white" : "",
                          ].join(" ")}
                        >
                          <ChildIcon size={13} className="shrink-0" />
                          <span className="whitespace-nowrap">
                            {child.title}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex h-11 shrink-0 items-center justify-center bg-[#05223f] text-white transition hover:bg-[#0a3a68]"
      >
        <ChevronLeft
          size={18}
          className={collapsed ? "rotate-180 transition" : "transition"}
        />
      </button>
    </aside>
  );
}
