import { Trophy, Medal, Award } from "lucide-react";

export default function LGULeaderboardSection({ leaderboard }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Barangay Leaderboard</h3>

          <p className="text-sm text-gray-500">
            Ranking based on total waste collection and recycling participation.
          </p>
        </div>

        <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl text-sm font-semibold">
          Live Ranking
        </div>
      </div>

      <div className="divide-y">
        {leaderboard.map((item, index) => (
          <LeaderboardCard
            key={item.barangay}
            item={item}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

function LeaderboardCard({ item, rank }) {
  return (
    <div className="p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 hover:bg-gray-50 transition">
      <div className="flex items-center gap-4">
        <RankIcon rank={rank} />

        <div>
          <h4 className="font-bold text-lg">{item.barangay}</h4>

          <p className="text-sm text-gray-500">
            Total Waste: {item.totalKg} kg
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold">
          {item.requests} Requests
        </div>

        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold">
          {item.recyclablePercentage}% Recyclable
        </div>
      </div>
    </div>
  );
}

function RankIcon({ rank }) {
  if (rank === 1) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center">
        <Trophy size={28} />
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-gray-200 text-gray-700 flex items-center justify-center">
        <Medal size={28} />
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center">
        <Award size={28} />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center font-bold text-lg">
      #{rank}
    </div>
  );
}