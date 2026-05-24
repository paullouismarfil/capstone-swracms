import { useEffect, useState } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function LGULeaderboardSection() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  async function fetchLeaderboardData() {
    setLoading(true);

    const { data: requestsData, error: requestsError } = await supabase
      .from("collection_requests")
      .select("*");

    const { data: wasteRecordsData, error: wasteError } = await supabase
      .from("waste_records")
      .select("*");

    if (requestsError || wasteError) {
      console.error("Leaderboard fetch error:", requestsError || wasteError);
      alert("Failed to load leaderboard data.");
      setLoading(false);
      return;
    }

    const ranking = calculateLeaderboard(
      requestsData || [],
      wasteRecordsData || []
    );

    setLeaderboard(ranking);
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Barangay Leaderboard</h3>

          <p className="text-sm text-gray-500">
            Ranking based on collected requests, total waste records, and missed
            collection performance.
          </p>
        </div>

        <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl text-sm font-semibold">
          Live Ranking
        </div>
      </div>

      {loading && (
        <div className="p-6 text-gray-500 text-sm">
          Loading leaderboard data...
        </div>
      )}

      {!loading && leaderboard.length === 0 && (
        <div className="p-6 text-gray-500 text-sm">
          No leaderboard data yet. Barangay ranking will appear after requests
          are collected.
        </div>
      )}

      {!loading && leaderboard.length > 0 && (
        <div className="divide-y">
          {leaderboard.map((item, index) => (
            <LeaderboardCard
              key={item.barangay}
              item={item}
              rank={index + 1}
            />
          ))}
        </div>
      )}
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

          <p className="text-xs text-gray-400 mt-1">
            Score: {item.score} pts • Missed: {item.missedRequests}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold">
          {item.collectedRequests} Collected
        </div>

        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold">
          {item.recyclablePercentage}% Recyclable
        </div>

        <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold">
          {item.totalRequests} Requests
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

function calculateLeaderboard(requests, wasteRecords) {
  const barangayMap = {};

  requests.forEach((request) => {
    const barangay = normalizeBarangayDisplay(request.barangay);

    if (!barangay) return;

    if (!barangayMap[barangay]) {
      barangayMap[barangay] = createEmptyBarangayStats(barangay);
    }

    barangayMap[barangay].totalRequests += 1;

    if (request.status === "Collected") {
      barangayMap[barangay].collectedRequests += 1;
    }

    if (request.status === "Missed") {
      barangayMap[barangay].missedRequests += 1;
    }
  });

  wasteRecords.forEach((record) => {
    const barangay = normalizeBarangayDisplay(
      record.route_name || record.barangay
    );

    if (!barangay) return;

    if (!barangayMap[barangay]) {
      barangayMap[barangay] = createEmptyBarangayStats(barangay);
    }

    const kg = parseKg(record.actual_weight);
    barangayMap[barangay].totalKg += kg;

    if (isRecyclable(record.waste_type)) {
      barangayMap[barangay].recyclableKg += kg;
    }
  });

  return Object.values(barangayMap)
    .map((item) => {
      const recyclablePercentage =
        item.totalKg > 0
          ? Math.round((item.recyclableKg / item.totalKg) * 100)
          : 0;

      const score =
        item.collectedRequests * 10 +
        item.totalKg +
        recyclablePercentage -
        item.missedRequests * 5;

      return {
        ...item,
        totalKg: Number(item.totalKg.toFixed(2)),
        recyclableKg: Number(item.recyclableKg.toFixed(2)),
        recyclablePercentage,
        score: Math.max(0, Number(score.toFixed(2))),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function createEmptyBarangayStats(barangay) {
  return {
    barangay,
    totalRequests: 0,
    collectedRequests: 0,
    missedRequests: 0,
    totalKg: 0,
    recyclableKg: 0,
    recyclablePercentage: 0,
    score: 0,
  };
}

function normalizeBarangayDisplay(value) {
  if (!value) return "";

  const cleaned = String(value)
    .trim()
    .replace(/\s+/g, " ");

  if (!cleaned) return "";

  if (cleaned.toLowerCase().startsWith("barangay ")) {
    return cleaned;
  }

  return `Barangay ${cleaned}`;
}

function parseKg(value) {
  if (!value) return 0;

  const number = String(value).replace(/[^0-9.]/g, "");
  return Number(number) || 0;
}

function isRecyclable(type) {
  const recyclableTypes = [
    "recyclable",
    "plastic",
    "metal",
    "glass",
  ];

  const lower = String(type || "").toLowerCase();

  return recyclableTypes.some((keyword) => lower.includes(keyword));
}