import { useEffect, useState } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { supabase } from "../../lib/supabase";

const RECYCLABLE_POINT_RULES = {
  plastic: 3,
  metal: 5,
  glass: 2,
  recyclable: 3,
};

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
      <div className="p-6 border-b flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Barangay Leaderboard</h3>

          <p className="text-sm text-gray-500">
            Ranking based on recyclable and recoverable waste such as plastic,
            metal, glass, and other recyclable materials.
          </p>
        </div>

        <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl text-sm font-semibold shrink-0">
          Recycling-Based Ranking
        </div>
      </div>

      <div className="px-6 py-4 bg-green-50 border-b">
        <p className="text-sm text-green-800 font-semibold">
          Points are not based on the highest total garbage volume.
        </p>

        <p className="text-xs text-green-700 mt-1 leading-relaxed">
          The leaderboard rewards barangays that collect useful recyclable
          materials such as plastic, metal, glass, and recyclable waste.
          Residual, mixed waste, and biodegradable waste do not add waste-volume
          points to avoid ranking barangays by “padamihan ng basura.”
        </p>
      </div>

      {loading && (
        <div className="p-6 text-gray-500 text-sm">
          Loading leaderboard data...
        </div>
      )}

      {!loading && leaderboard.length === 0 && (
        <div className="p-6 text-gray-500 text-sm">
          No leaderboard data yet. Barangay ranking will appear once barangays
          submit requests or once recyclable collection records are encoded.
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
            Recyclable Value Waste: {formatKg(item.valueWasteKg)} kg
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Score: {formatKg(item.score)} pts • Missed: {item.missedRequests} •
            Improper: {item.improperRequests}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold">
          Plastic: {formatKg(item.plasticKg)} kg
        </div>

        <div className="bg-teal-100 text-teal-700 px-4 py-2 rounded-xl text-sm font-semibold">
          Metal: {formatKg(item.metalKg)} kg
        </div>

        <div className="bg-cyan-100 text-cyan-700 px-4 py-2 rounded-xl text-sm font-semibold">
          Glass: {formatKg(item.glassKg)} kg
        </div>

        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold">
          Recyclable: {formatKg(item.recyclableKg)} kg
        </div>

        <div className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold">
          {item.totalRequests} Requests
        </div>

        <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold">
          {item.collectedRequests} Collected
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

    const status = normalizeStatus(request.status);

    barangayMap[barangay].totalRequests += 1;

    if (status === "pending") {
      barangayMap[barangay].pendingRequests += 1;
    }

    if (status === "scheduled") {
      barangayMap[barangay].scheduledRequests += 1;
    }

    if (status === "in progress") {
      barangayMap[barangay].inProgressRequests += 1;
    }

    if (status === "collected") {
      barangayMap[barangay].collectedRequests += 1;
    }

    if (status === "missed") {
      barangayMap[barangay].missedRequests += 1;
    }

    if (status === "improper segregation") {
      barangayMap[barangay].improperRequests += 1;
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
    const wasteType = normalizeWasteType(record.waste_type);

    barangayMap[barangay].totalKg += kg;

    if (wasteType === "plastic") {
      barangayMap[barangay].plasticKg += kg;
      barangayMap[barangay].valueWasteKg += kg;
      barangayMap[barangay].recyclableValuePoints +=
        kg * RECYCLABLE_POINT_RULES.plastic;
    }

    if (wasteType === "metal") {
      barangayMap[barangay].metalKg += kg;
      barangayMap[barangay].valueWasteKg += kg;
      barangayMap[barangay].recyclableValuePoints +=
        kg * RECYCLABLE_POINT_RULES.metal;
    }

    if (wasteType === "glass") {
      barangayMap[barangay].glassKg += kg;
      barangayMap[barangay].valueWasteKg += kg;
      barangayMap[barangay].recyclableValuePoints +=
        kg * RECYCLABLE_POINT_RULES.glass;
    }

    if (wasteType === "recyclable") {
      barangayMap[barangay].recyclableKg += kg;
      barangayMap[barangay].valueWasteKg += kg;
      barangayMap[barangay].recyclableValuePoints +=
        kg * RECYCLABLE_POINT_RULES.recyclable;
    }

    if (
      wasteType === "residual" ||
      wasteType === "mixed waste" ||
      wasteType === "biodegradable" ||
      wasteType === "unspecified"
    ) {
      barangayMap[barangay].nonValueWasteKg += kg;
    }
  });

  return Object.values(barangayMap)
    .map((item) => {
      const penalty = item.missedRequests * 5 + item.improperRequests * 10;

      const score = item.recyclableValuePoints - penalty;

      return {
        ...item,
        totalKg: roundNumber(item.totalKg),
        plasticKg: roundNumber(item.plasticKg),
        metalKg: roundNumber(item.metalKg),
        glassKg: roundNumber(item.glassKg),
        recyclableKg: roundNumber(item.recyclableKg),
        valueWasteKg: roundNumber(item.valueWasteKg),
        nonValueWasteKg: roundNumber(item.nonValueWasteKg),
        recyclableValuePoints: roundNumber(item.recyclableValuePoints),
        score: Math.max(0, roundNumber(score)),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      if (b.recyclableValuePoints !== a.recyclableValuePoints) {
        return b.recyclableValuePoints - a.recyclableValuePoints;
      }

      if (b.valueWasteKg !== a.valueWasteKg) {
        return b.valueWasteKg - a.valueWasteKg;
      }

      if (b.collectedRequests !== a.collectedRequests) {
        return b.collectedRequests - a.collectedRequests;
      }

      return b.totalRequests - a.totalRequests;
    });
}

function createEmptyBarangayStats(barangay) {
  return {
    barangay,
    totalRequests: 0,
    pendingRequests: 0,
    scheduledRequests: 0,
    inProgressRequests: 0,
    collectedRequests: 0,
    missedRequests: 0,
    improperRequests: 0,
    totalKg: 0,
    plasticKg: 0,
    metalKg: 0,
    glassKg: 0,
    recyclableKg: 0,
    valueWasteKg: 0,
    nonValueWasteKg: 0,
    recyclableValuePoints: 0,
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

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeWasteType(type) {
  const lower = String(type || "").trim().toLowerCase();

  if (lower.includes("plastic")) return "plastic";
  if (lower.includes("metal")) return "metal";
  if (lower.includes("glass")) return "glass";
  if (lower.includes("recyclable")) return "recyclable";
  if (lower.includes("bio")) return "biodegradable";
  if (lower.includes("residual")) return "residual";
  if (lower.includes("mixed")) return "mixed waste";

  return "unspecified";
}

function parseKg(value) {
  if (!value) return 0;

  const number = String(value).replace(/[^0-9.]/g, "");
  return Number(number) || 0;
}

function roundNumber(value) {
  return Number((Number(value) || 0).toFixed(2));
}

function formatKg(value) {
  const number = Number(value) || 0;

  if (Number.isInteger(number)) {
    return String(number);
  }

  return String(Number(number.toFixed(2)));
}