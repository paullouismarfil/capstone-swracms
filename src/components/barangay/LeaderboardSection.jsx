import LeaderboardCard from "./LeaderboardCard";
import OverviewCard from "./OverviewCard";

export default function LeaderboardSection() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <LeaderboardCard />

      <div className="bg-white rounded-3xl shadow-sm border p-6">
        <h3 className="text-xl font-bold">Ranking Criteria</h3>

        <p className="text-sm text-gray-500 mb-5">
          Barangay ranking is calculated based on actual collection activity,
          completed requests, total collected waste, recyclable participation,
          and missed collection penalties.
        </p>

        <div className="space-y-4">
          <OverviewCard title="Collected Requests" value="+10 pts each" />
          <OverviewCard title="Total Collected Waste" value="+1 pt per kg" />
          <OverviewCard title="Recyclable Percentage" value="Bonus pts" />
          <OverviewCard title="Missed Requests" value="-5 pts each" />
        </div>

        <div className="mt-6 bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-green-800">
            How ranking works
          </p>

          <p className="text-xs text-green-700 mt-1 leading-relaxed">
            A barangay earns points when collection requests are successfully
            completed and recorded. Recyclable waste improves the barangay score,
            while missed collections reduce the ranking points.
          </p>
        </div>
      </div>
    </div>
  );
}