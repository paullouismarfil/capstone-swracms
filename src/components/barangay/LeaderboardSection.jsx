import LeaderboardCard from "./LeaderboardCard";
import OverviewCard from "./OverviewCard";

export default function LeaderboardSection() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <LeaderboardCard />

      <div className="bg-white rounded-3xl shadow-sm border p-6">
        <h3 className="text-xl font-bold">Ranking Criteria</h3>

        <p className="text-sm text-gray-500 mb-5">
          Barangay ranking is based on useful recyclable and recoverable waste,
          not on the highest total garbage volume. The system rewards materials
          that can still be recycled, reused, or sold.
        </p>

        <div className="space-y-4">
          <OverviewCard title="Plastic Collected" value="+3 pts per kg" />
          <OverviewCard title="Metal Collected" value="+5 pts per kg" />
          <OverviewCard title="Glass Collected" value="+2 pts per kg" />
          <OverviewCard title="Recyclable Waste" value="+3 pts per kg" />

          <OverviewCard title="Submitted Requests" value="+1 pt each" />
          <OverviewCard title="Scheduled Pickups" value="+1 pt each" />
          <OverviewCard title="In Progress Pickups" value="+1 pt each" />
          <OverviewCard title="Collected Requests" value="+3 pts each" />

          <OverviewCard
            title="Residual / Mixed / Biodegradable"
            value="0 volume pts"
          />

          <OverviewCard title="Missed Requests" value="-3 pts each" />
          <OverviewCard title="Improper Segregation" value="-5 pts each" />
        </div>

        <div className="mt-6 bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-green-800">
            How ranking works
          </p>

          <p className="text-xs text-green-700 mt-1 leading-relaxed">
            A barangay earns higher points when it records useful recyclable
            materials such as plastic, metal, glass, and recyclable waste. This
            encourages proper segregation and material recovery instead of
            ranking barangays by the amount of garbage produced.
          </p>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-yellow-800">
            Important Note
          </p>

          <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
            Residual, mixed waste, and biodegradable waste are still recorded in
            the system for reports and monitoring, but they do not increase the
            leaderboard score based on volume.
          </p>
        </div>
      </div>
    </div>
  );
}