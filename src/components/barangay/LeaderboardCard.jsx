import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function LeaderboardCard() {
  const [loading, setLoading] = useState(false);
  const [barangayRank, setBarangayRank] = useState(null);

  useEffect(() => {
    fetchBarangayRanking();
  }, []);

  async function fetchBarangayRanking() {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profileData) {
      console.error("Profile fetch error:", profileError);
      setLoading(false);
      return;
    }

    const currentBarangay = normalizeBarangayDisplay(profileData.barangay);

    const { data: requestsData, error: requestsError } = await supabase
      .from("collection_requests")
      .select("*");

    const { data: wasteRecordsData, error: wasteError } = await supabase
      .from("waste_records")
      .select("*");

    if (requestsError || wasteError) {
      console.error("Leaderboard fetch error:", requestsError || wasteError);
      setLoading(false);
      return;
    }

    const ranking = calculateLeaderboard(
      requestsData || [],
      wasteRecordsData || []
    );

    const currentIndex = ranking.findIndex(
      (item) => normalizeBarangayDisplay(item.barangay) === currentBarangay
    );

    if (currentIndex === -1) {
      setBarangayRank({
        barangay: currentBarangay || "Barangay",
        rank: "—",
        score: 0,
        totalKg: 0,
        collectedRequests: 0,
      });
    } else {
      setBarangayRank({
        ...ranking[currentIndex],
        rank: currentIndex + 1,
      });
    }

    setLoading(false);
  }

  return (
    <div className="bg-gradient-to-br from-green-700 to-green-900 text-white rounded-3xl shadow-sm p-6">
      <h3 className="text-xl font-bold">Barangay Performance</h3>

      <p className="text-green-100 text-sm mt-1">
        Current barangay ranking for waste management.
      </p>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <p className="text-5xl font-bold">
            {loading ? "..." : `#${barangayRank?.rank || "—"}`}
          </p>

          <p className="text-green-100 mt-1">Current Rank</p>
        </div>

        <Trophy size={60} className="text-yellow-300" />
      </div>

      <div className="mt-6 bg-white/10 rounded-2xl p-4">
        <p className="text-sm text-green-100">Performance Points</p>

        <p className="text-2xl font-bold">
          {loading ? "Loading..." : `${barangayRank?.score || 0} pts`}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-xs text-green-100">Collected</p>

          <p className="text-xl font-bold">
            {barangayRank?.collectedRequests || 0}
          </p>
        </div>

        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-xs text-green-100">Total Waste</p>

          <p className="text-xl font-bold">
            {barangayRank?.totalKg || 0} kg
          </p>
        </div>
      </div>
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

  const cleaned = String(value).trim().replace(/\s+/g, " ");

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