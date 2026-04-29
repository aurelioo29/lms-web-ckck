import { requirePermission } from "@/lib/require-permission";
import ActivityLogsTable from "@/features/activity-logs/components/activity-logs-table";

export default async function ActivityLogsPage() {
  await requirePermission("activity_logs.view");

  return (
    <div>
      <div className="mb-5">
        <h3 className="mb-1 text-2xl font-bold text-slate-900">
          Activity Logs
        </h3>
        <p className="text-sm text-slate-500">
          Pantau semua aktivitas sistem, termasuk old data dan new data.
        </p>
      </div>

      <ActivityLogsTable />
    </div>
  );
}
