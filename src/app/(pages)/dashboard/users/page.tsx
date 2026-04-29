import { requirePermission } from "@/lib/require-permission";
import UsersTable from "@/features/users/components/users-table";

export default async function UsersPage() {
  await requirePermission("users.view");

  return (
    <div>
      <div className="mb-5">
        <h3 className="mb-1 text-2xl font-bold text-slate-900">Users</h3>
        <p className="text-sm text-slate-500">
          Kelola user, status akun, role, dan reset password.
        </p>
      </div>

      <UsersTable />
    </div>
  );
}
