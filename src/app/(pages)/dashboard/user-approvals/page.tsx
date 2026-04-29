import { requirePermission } from "@/lib/require-permission";
import UserApprovalTable from "@/features/user-approvals/components/user-approval.table";

export default async function UserApprovalsPage() {
  await requirePermission("user_approvals.view");

  return (
    <div>
      <div className="mb-5">
        <h3 className="mb-1 text-2xl font-bold text-slate-900">
          User Approval
        </h3>
        <p className="text-sm text-slate-500">
          Kelola akun baru yang menunggu persetujuan.
        </p>
      </div>

      <UserApprovalTable />
    </div>
  );
}
