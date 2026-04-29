"use client";

import NotificationPopover from "@/features/notifications/components/notification-popover";
import UserDropdown from "@/features/profile/components/user-dropdown";

type DashboardTopbarProps = {
  userName: string;
};

export default function DashboardTopbar({ userName }: DashboardTopbarProps) {
  return (
    <header className="flex h-12 items-center justify-end border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-2">
        <NotificationPopover />
        <UserDropdown userName={userName} />
      </div>
    </header>
  );
}
