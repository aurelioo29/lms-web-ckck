import type { Session } from "next-auth";

export function hasPermission(
  session: Session | null,
  permission: string,
): boolean {
  if (!session?.user?.permissions) return false;

  return session.user.permissions.includes(permission);
}

export function hasAnyPermission(
  session: Session | null,
  permissions: string[],
): boolean {
  if (!session?.user?.permissions) return false;

  return permissions.some((permission) =>
    session.user.permissions.includes(permission),
  );
}

export function hasRole(session: Session | null, role: string): boolean {
  if (!session?.user?.roles) return false;

  return session.user.roles.includes(role);
}

export function isSuperadmin(session: Session | null): boolean {
  return hasRole(session, "SUPERADMIN");
}
