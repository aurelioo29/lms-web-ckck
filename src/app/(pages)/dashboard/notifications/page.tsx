import NotificationsTable from "@/features/notifications/components/notification-table";

export default function NotificationsPage() {
  return (
    <div>
      <div className="mb-5">
        <h3 className="mb-1 text-2xl font-bold text-slate-900">
          Notifications
        </h3>
        <p className="text-sm text-slate-500">
          Lihat semua notification sistem dan tandai yang sudah dibaca.
        </p>
      </div>

      <NotificationsTable />
    </div>
  );
}
