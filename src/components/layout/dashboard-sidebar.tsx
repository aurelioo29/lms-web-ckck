"use client";

import { useMemo, useState } from "react";
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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

  const visibleGroups = useMemo(() => {
    return groups
      .filter((group) => group.show !== false)
      .map((group) => ({
        ...group,
        children:
          group.children?.filter((child) => child.show !== false) ?? undefined,
      }));
  }, [permissions]);

  function isChildActive(children?: SidebarChild[]) {
    return children?.some((child) => pathname.startsWith(child.href)) ?? false;
  }

  function isGroupOpen(group: SidebarGroup) {
    const childActive = isChildActive(group.children);

    if (childActive) return true;

    return openGroups[group.title] ?? false;
  }

  function toggleGroup(title: string) {
    setOpenGroups((current) => ({
      ...current,
      [title]: !current[title],
    }));
  }

  return (
    <aside
      className={[
        "sticky top-0 z-40 flex h-screen shrink-0 flex-col border-r border-white/10 bg-[#062b4f] text-white shadow-xl transition-all duration-300",
        collapsed ? "w-[72px] overflow-visible" : "w-[252px] overflow-hidden",
      ].join(" ")}
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
        <div
          className={[
            "flex min-w-0 items-center gap-3",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-black text-white ring-1 ring-white/10">
            CK
          </div>

          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-5 text-white">
                CKCK LMS
              </p>
              <p className="truncate text-[11px] text-white/55">
                Learning System
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Menu */}
      <nav
        className={[
          "min-h-0 flex-1 space-y-1 px-3 py-4",
          collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden",
        ].join(" ")}
      >
        {visibleGroups.map((group) => {
          const GroupIcon = group.icon;
          const children = group.children ?? [];

          if (group.href) {
            const active =
              pathname === group.href || pathname.startsWith(`${group.href}/`);

            return (
              <Link
                key={group.title}
                href={group.href}
                title={collapsed ? group.title : undefined}
                className={[
                  "flex h-10 items-center rounded-xl text-[13px] font-medium transition",
                  collapsed
                    ? "justify-center px-0"
                    : "justify-start gap-3 px-3",
                  active
                    ? "bg-white text-[#062b4f] shadow-sm"
                    : "text-white/78 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <GroupIcon size={18} className="shrink-0" />

                {!collapsed ? (
                  <span className="min-w-0 flex-1 truncate">{group.title}</span>
                ) : null}
              </Link>
            );
          }

          const open = isGroupOpen(group);
          const childActive = isChildActive(children);

          return (
            <div key={group.title} className="group relative">
              <button
                type="button"
                onClick={() => {
                  if (!collapsed) toggleGroup(group.title);
                }}
                title={collapsed ? group.title : undefined}
                className={[
                  "flex h-10 w-full items-center rounded-xl text-left text-[13px] font-medium transition",
                  collapsed
                    ? "justify-center px-0"
                    : "justify-start gap-3 px-3",
                  childActive
                    ? "bg-white/15 text-white"
                    : "text-white/78 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <GroupIcon size={18} className="shrink-0" />

                {!collapsed ? (
                  <>
                    <span className="min-w-0 flex-1 truncate">
                      {group.title}
                    </span>

                    <ChevronDown
                      size={16}
                      className={[
                        "shrink-0 text-white/60 transition-transform duration-200",
                        open ? "rotate-180" : "",
                      ].join(" ")}
                    />
                  </>
                ) : null}
              </button>

              {/* Expanded children */}
              {!collapsed && open ? (
                <div className="mt-1 space-y-1 border-l border-white/10 pl-4">
                  {children.map((child) => {
                    const ChildIcon = child.icon;
                    const active =
                      pathname === child.href ||
                      pathname.startsWith(`${child.href}/`);

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={[
                          "flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] transition",
                          active
                            ? "bg-white text-[#062b4f] shadow-sm"
                            : "text-white/65 hover:bg-white/10 hover:text-white",
                        ].join(" ")}
                      >
                        <ChildIcon size={15} className="shrink-0" />
                        <span className="min-w-0 truncate">{child.title}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}

              {/* Collapsed hover popup */}
              {collapsed && children.length > 0 ? (
                <div className="invisible absolute left-[calc(100%+10px)] top-0 z-50 min-w-[220px] rounded-2xl border border-white/10 bg-[#031c34] p-2 opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
                  <div className="mb-1 border-b border-white/10 px-3 py-2">
                    <p className="text-xs font-bold text-white">
                      {group.title}
                    </p>
                  </div>

                  <div className="space-y-1">
                    {children.map((child) => {
                      const ChildIcon = child.icon;
                      const active =
                        pathname === child.href ||
                        pathname.startsWith(`${child.href}/`);

                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={[
                            "flex h-9 items-center gap-3 rounded-lg px-3 text-xs transition",
                            active
                              ? "bg-[#1677ff] text-white"
                              : "text-white/75 hover:bg-white/10 hover:text-white",
                          ].join(" ")}
                        >
                          <ChildIcon size={14} className="shrink-0" />
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

      {/* Collapse button */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex h-10 w-full items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            size={18}
            className={[
              "transition-transform duration-300",
              collapsed ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>
      </div>
    </aside>
  );
}
