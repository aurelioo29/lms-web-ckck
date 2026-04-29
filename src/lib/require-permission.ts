import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { hasPermission } from "@/lib/permissions";

export async function requirePermission(permission: string) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (!hasPermission(session, permission)) {
    redirect("/dashboard");
  }

  return session;
}
