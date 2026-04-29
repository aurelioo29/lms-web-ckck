import { requirePermission } from "@/lib/require-permission";
import RolesTable from "@/features/roles/components/roles-table";

export default async function RolesPage() {
  await requirePermission("roles.view");

  return (
    <div>
      <div className="mb-5">
        <h3 className="text-2xl font-bold">Roles</h3>
        <p className="text-sm text-slate-500">
          Kelola role dan permission sistem.
        </p>
      </div>

      <RolesTable />
    </div>
  );
}