import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getBooleanSetting } from "@/lib/settings";
import DashboardLayoutClient from "./dashboard-layout-client";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const maintenanceMode = await getBooleanSetting("maintenance_mode", false);

  const roles = session.user.roles || [];
  const isSuperadmin = roles.includes("SUPERADMIN");

  if (maintenanceMode && !isSuperadmin) {
    redirect("/maintenance");
  }

  return (
    <DashboardLayoutClient
      user={{
        name: session.user.name || "User",
        permissions: session.user.permissions || [],
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}
