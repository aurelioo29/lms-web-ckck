import LeaderboardTable from "@/features/points/components/leaderboard-table";

export default function LeaderboardPage() {
  return (
    <div>
      <div className="mb-5">
        <h3 className="mb-1 text-2xl font-bold text-slate-900">Leaderboard</h3>
        <p className="text-sm text-slate-500">
          Ranking user berdasarkan total points.
        </p>
      </div>

      <LeaderboardTable />
    </div>
  );
}
