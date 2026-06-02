import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { supabase } from "../../lib/supabase";

const RECYCLABLE_POINT_RULES = {
  plastic: 3,
  metal: 5,
  glass: 2,
  recyclable: 3,
};

export default function LeaderboardCard() {
  const [loading, setLoading] = useState(false);
  const [barangayRank, setBarangayRank] = useState(null);

  useEffect(() => {
    fetchBarangayRanking();
  }, []);

  async function fetchBarangayRanking() {
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        setBarangayRank(createDefaultRank("Barangay"));
        setLoading(false);
        return;
      }

      const profileData = await findCurrentUserProfile(user);

      if (!profileData) {
        console.warn("No barangay profile found for:", user.email);

        setBarangayRank({
          ...createDefaultRank("Barangay"),
          debugMessage: "No matching barangay profile found.",
        });

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
        setBarangayRank(createDefaultRank(currentBarangay || "Barangay"));
        setLoading(false);
        return;
      }

      const ranking = calculateLeaderboard(
        requestsData || [],
        wasteRecordsData || []
      );

      const currentBarangayKey = normalizeBarangayKey(currentBarangay);

      const currentIndex = ranking.findIndex(
        (item) => normalizeBarangayKey(item.barangay) === currentBarangayKey
      );

      if (currentIndex === -1) {
        setBarangayRank({
          ...createDefaultRank(currentBarangay || "Barangay"),
          barangay: currentBarangay || "Barangay",
          rank: "—",
        });
      } else {
        setBarangayRank({
          ...ranking[currentIndex],
          rank: currentIndex + 1,
        });
      }
    } catch (error) {
      console.error("Barangay leaderboard error:", error);
      setBarangayRank(createDefaultRank("Barangay"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-green-700 to-green-900 text-white rounded-3xl shadow-sm p-6">
      <h3 className="text-xl font-bold">Barangay Performance</h3>

      <p className="text-green-100 text-sm mt-1">
        Ranking based on useful recyclable waste, not total garbage volume.
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
          {loading ? "Loading..." : `${formatKg(barangayRank?.score || 0)} pts`}
        </p>

        <p className="text-xs text-green-100 mt-1">
          Points are earned from plastic, metal, glass, and recyclable materials.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniStat
          label="Value Waste"
          value={`${formatKg(barangayRank?.valueWasteKg || 0)} kg`}
        />

        <MiniStat
          label="Plastic"
          value={`${formatKg(barangayRank?.plasticKg || 0)} kg`}
        />

        <MiniStat
          label="Metal"
          value={`${formatKg(barangayRank?.metalKg || 0)} kg`}
        />

        <MiniStat
          label="Glass"
          value={`${formatKg(barangayRank?.glassKg || 0)} kg`}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniStat
          label="Recyclable"
          value={`${formatKg(barangayRank?.recyclableKg || 0)} kg`}
        />

        <MiniStat label="Requests" value={barangayRank?.totalRequests || 0} />

        <MiniStat
          label="Collected"
          value={barangayRank?.collectedRequests || 0}
        />

        <MiniStat
          label="Non-Value Waste"
          value={`${formatKg(barangayRank?.nonValueWasteKg || 0)} kg`}
        />
      </div>

      {(barangayRank?.missedRequests > 0 ||
        barangayRank?.improperRequests > 0) && (
          <div className="mt-4 bg-red-500/20 border border-red-300/30 rounded-2xl p-4">
            <p className="text-xs text-red-100">Penalties</p>
            <p className="text-sm font-semibold mt-1">
              Missed: {barangayRank?.missedRequests || 0} • Improper:{" "}
              {barangayRank?.improperRequests || 0}
            </p>
          </div>
        )}

      <div className="mt-4 bg-white/10 border border-white/20 rounded-2xl p-4">
        <p className="text-xs text-green-100 leading-relaxed">
          Residual, mixed waste, and biodegradable waste are recorded for reports
          but do not increase leaderboard points.
        </p>
      </div>

      {barangayRank?.debugMessage && (
        <div className="mt-4 bg-white/10 border border-white/20 rounded-2xl p-4">
          <p className="text-xs text-green-100">{barangayRank.debugMessage}</p>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-white/10 rounded-2xl p-4">
      <p className="text-xs text-green-100">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

async function findCurrentUserProfile(user) {
  const email = String(user?.email || "").toLowerCase();
  const authUserId = user?.id;

  if (authUserId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .or(`auth_user_id.eq.${authUserId},id.eq.${authUserId}`)
      .maybeSingle();

    if (data) return data;
  }

  if (email) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (data) return data;
  }

  return null;
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

function createDefaultRank(barangay) {
  return {
    barangay,
    rank: "—",
    score: 0,
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

function normalizeBarangayKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^barangay\s+/i, "")
    .replace(/^brgy\.?\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
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