import PointsHistory from "@/features/points/components/points-history";

export default function PointsPage() {
  return (
    <div>
      <div className="mb-5">
        <h3 className="mb-1 text-2xl font-bold text-slate-900">My Points</h3>
        <p className="text-sm text-slate-500">
          Riwayat point dari aktivitas belajar kamu.
        </p>
      </div>

      <PointsHistory />
    </div>
  );
}
