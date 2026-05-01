"use client";

import DashboardBreadcrumb from "./dashboard-breadcrumb";
import DashboardSidebar from "./dashboard-sidebar";
import DashboardTopbar from "./dashboard-topbar";

type DashboardLayoutClientProps = {
  children: React.ReactNode;
  user: {
    name: string;
    permissions: string[];
  };
};

export default function DashboardLayoutClient({
  children,
  user,
}: DashboardLayoutClientProps) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <DashboardSidebar permissions={user.permissions} />

      <main className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar userName={user.name} />

        <section className="flex-1 px-4 pb-4">
          <DashboardBreadcrumb />

          <div className="mt-3 min-h-[calc(100vh-112px)] p-3">{children}</div>
        </section>
      </main>
    </div>
  );
}
