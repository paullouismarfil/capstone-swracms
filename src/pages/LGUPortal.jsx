import { useEffect, useMemo, useState } from "react";
import LGUSidebar from "../components/lgu/LGUSidebar";
import ReportsTable from "../components/lgu/ReportsTable";
import NotificationsPage from "../components/NotificationsPage";
import LGUTopHeader from "../components/lgu/LGUTopHeader";
import LGUScheduleSection from "../components/lgu/LGUScheduleSection";
import LGUStatCards from "../components/lgu/LGUStatCards";
import LGULeaderboardSection from "../components/lgu/LGULeaderboardSection";
import LGUUsersSection from "../components/lgu/LGUUsersSection";
import RequestDetailsModal from "../components/lgu/RequestDetailsModal";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { searchCollectionRequests } from "../utils/searchHelpers";
import { collectionSchedule } from "../data/collectionSchedule";
import CollectionMap from "../components/lgu/CollectionMap";
import { supabase } from "../lib/supabase";
import LGUAnalyticsSection, { LGUWasteCompositionCard, LGUAnalyticsSummaryCard, } from "../components/lgu/LGUAnalyticsSection";
import {
  FileText,
  Truck,
  Scale,
  CheckCircle,
  ChartPie,
  Recycle,
} from "lucide-react";

export default function LGUPortal() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState([]);
  const [wasteRecords, setWasteRecords] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
    fetchWasteRecords();
  }, []);

  async function fetchRequests() {
    setLoadingRequests(true);

    const { data, error } = await supabase
      .from("collection_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setRequests(data || []);
    setLoadingRequests(false);
  }

  async function fetchWasteRecords() {
    const { data, error } = await supabase
      .from("waste_records")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setWasteRecords(data || []);
  }

  async function updateRequestStatus(id, status) {
    const requestData = requests.find((r) => r.id === id);

    const { error } = await supabase
      .from("collection_requests")
      .update({ status })
      .eq("id", id);

    if (!error) {
      await supabase.from("notifications").insert([
        {
          role: "barangay",
          title: `Request ${status}`,
          message: `Your waste collection request has been marked as "${status}" by MENRO.`,
          type: "status_update",
          is_read: false,
        },
      ]);

      if (status === "Scheduled") {
        await supabase.from("notifications").insert([
          {
            role: "collector",
            title: "New Pickup Schedule",
            message: `${requestData?.barangay || "Barangay"} request is now scheduled for collection.`,
            type: "collection_schedule",
            is_read: false,
          },
        ]);
      }

      if (status === "Collected") {
        await supabase.from("notifications").insert([
          {
            role: "lgu_admin",
            title: "Collection Completed",
            message: `${requestData?.barangay || "Barangay"} request has been marked as collected.`,
            type: "collection_complete",
            is_read: false,
          },
        ]);
      }

      fetchRequests();
      fetchWasteRecords();
    }
  }

  const totalReports = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "Pending").length;
  const scheduledRequests = requests.filter((r) => r.status === "Scheduled").length;


  const analytics = useMemo(
    () => calculateWasteAnalytics(wasteRecords),
    [wasteRecords]
  );

  const leaderboard = [
    { barangay: "Barangay Poblacion", points: 98 },
    { barangay: "Barangay Villahermosa", points: 91 },
    { barangay: "Barangay District 2", points: 86 },
  ];

  const schedules = collectionSchedule;
  const searchedRequests = searchCollectionRequests(requests, searchTerm);

  return (
    <div className="min-h-screen bg-[#f4f7f3] flex text-gray-900">
      <LGUSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <LGUTopHeader
          activeSection={activeSection}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
        {activeSection === "dashboard" && (
          <>
            <LGUStatCards
              totalReports={totalReports}
              pendingRequests={pendingRequests}
              scheduledRequests={scheduledRequests}
              totalWasteKg={analytics.totalKg}
              activeRoutes={schedules.length}
            />

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <ReportsTable
                reports={searchedRequests.slice(0, 5)}
                loading={loadingRequests}
                onView={setSelectedRequest}
                onStatusChange={updateRequestStatus}
              />

              <LGUWasteCompositionCard analytics={analytics} />
              <LGUAnalyticsSummaryCard analytics={analytics} />
              <LGUScheduleSection schedules={schedules} compact />
            </section>
          </>
        )}

        {activeSection === "reports" && (
          <ReportsTable
            reports={searchedRequests}
            loading={loadingRequests}
            full
            onView={setSelectedRequest}
            onStatusChange={updateRequestStatus}
          />
        )}

        {activeSection === "notifications" && (
          <NotificationsPage role="lgu_admin" />
        )}

        {activeSection === "schedule" && (
          <LGUScheduleSection schedules={schedules} />
        )}

        {activeSection === "analytics" && (
          <LGUAnalyticsSection analytics={analytics} records={wasteRecords} />
        )}

        {activeSection === "map" && <CollectionMap requests={requests} />}

        {activeSection === "leaderboard" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <LGULeaderboardSection leaderboard={leaderboard} />

            <div className="bg-white rounded-3xl shadow-sm border p-6">
              <h3 className="text-xl font-bold">Ranking Criteria</h3>
              <p className="text-sm text-gray-500 mb-5">
                Barangay performance is based on completion rate, reporting accuracy, coordination, and documentation.
              </p>

              <MiniBadge label="Completion Rate" value="40%" />
              <MiniBadge label="Reporting Accuracy" value="30%" />
              <MiniBadge label="Timely Coordination" value="20%" />
              <MiniBadge label="Photo Documentation" value="10%" />
            </div>
          </div>
        )}

        {activeSection === "users" && <LGUUsersSection />}

        {selectedRequest && (
          <RequestDetailsModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onStatusChange={async (id, status) => {
              await updateRequestStatus(id, status);
              setSelectedRequest(null);
            }}
          />
        )}
      </main>
    </div>
  );
}

function WasteAnalyticsDashboard({ analytics, records }) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Total Waste Collected" value={`${analytics.totalKg} kg`} note="Actual recorded waste" icon={<Scale size={26} />} color="green" />
        <StatCard title="Recyclable Waste" value={`${analytics.recyclablePercent}%`} note="Plastic, metal, glass, recyclable" icon={<Recycle size={26} />} color="blue" />
        <StatCard title="Top Waste Type" value={analytics.topWasteType || "N/A"} note="Most recorded category" icon={<ChartPie size={26} />} color="orange" />
        <StatCard title="Collection Records" value={records.length} note="Encoded by collection staff" icon={<FileText size={26} />} color="green" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <WasteCompositionCard analytics={analytics} />
        <MonthlyWasteTrend analytics={analytics} />
        <BarangayWasteRanking analytics={analytics} />
        <WasteTypeTable analytics={analytics} />
      </section>
    </div>
  );
}

function WasteCompositionCard({ analytics }) {
  const chartData = analytics.wasteTypes.map((item) => ({
    name: item.type,
    value: item.kg,
  }));

  const COLORS = [
    "#16a34a",
    "#2563eb",
    "#f97316",
    "#dc2626",
    "#7c3aed",
    "#0891b2",
    "#ca8a04",
    "#4b5563",
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6">
      <h3 className="text-xl font-bold">Waste Composition Analysis</h3>
      <p className="text-sm text-gray-500 mb-6">
        Percentage distribution of collected waste by type.
      </p>

      {chartData.length === 0 ? (
        <EmptyState text="No waste records yet. Analytics will appear after collection staff records actual waste." />
      ) : (
        <>
          <div className="w-full h-80 min-h-[320px]">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  innerRadius={50}
                  paddingAngle={3}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 space-y-4">
            {analytics.wasteTypes.map((item) => (
              <ProgressRow
                key={item.type}
                label={item.type}
                value={`${item.kg} kg`}
                percent={item.percent}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MonthlyWasteTrend({ analytics }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6">
      <h3 className="text-xl font-bold">Monthly Waste Trend</h3>
      <p className="text-sm text-gray-500 mb-6">
        Actual collected waste per month based on encoded records.
      </p>

      {analytics.monthly.length === 0 ? (
        <EmptyState text="No monthly data yet." />
      ) : (
        <div className="space-y-5">
          {analytics.monthly.map((item) => (
            <TrendBar
              key={item.month}
              month={item.month}
              value={`${item.kg} kg`}
              width={`${item.percent}%`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BarangayWasteRanking({ analytics }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6">
      <h3 className="text-xl font-bold">Barangay Waste Ranking</h3>
      <p className="text-sm text-gray-500 mb-6">
        Barangays or routes ranked by total actual waste collected.
      </p>

      {analytics.barangayRanking.length === 0 ? (
        <EmptyState text="No barangay ranking data yet." />
      ) : (
        <div className="space-y-4">
          {analytics.barangayRanking.map((item, index) => (
            <div key={item.barangay} className="flex items-center justify-between p-4 rounded-2xl border hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
                  #{index + 1}
                </div>

                <div>
                  <p className="font-semibold">{item.barangay}</p>
                  <p className="text-xs text-gray-500">Total collected waste</p>
                </div>
              </div>

              <p className="font-bold text-green-700">{item.kg} kg</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WasteTypeTable({ analytics }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-xl font-bold">Waste Type Breakdown</h3>
        <p className="text-sm text-gray-500">
          Detailed actual waste records by category.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="p-4 text-left">Waste Type</th>
              <th className="p-4 text-left">Total KG</th>
              <th className="p-4 text-left">Percentage</th>
              <th className="p-4 text-left">Category</th>
            </tr>
          </thead>

          <tbody>
            {analytics.wasteTypes.length === 0 && (
              <tr>
                <td colSpan="4" className="p-4 text-gray-500">
                  No waste records yet.
                </td>
              </tr>
            )}

            {analytics.wasteTypes.map((item) => (
              <tr key={item.type} className="border-t hover:bg-gray-50">
                <td className="p-4 font-semibold">{item.type}</td>
                <td className="p-4 text-green-700 font-bold">{item.kg} kg</td>
                <td className="p-4">{item.percent}%</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${isRecyclable(item.type)
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                      }`}
                  >
                    {isRecyclable(item.type) ? "Recyclable" : "Non-Recyclable"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsSummaryCard({ analytics }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6">
      <h3 className="text-xl font-bold">Recyclable Monitoring</h3>
      <p className="text-sm text-gray-500 mb-6">
        Summary of recyclable and non-recyclable collected waste.
      </p>

      <div className="space-y-4">
        <MiniBadge label="Total Actual Waste" value={`${analytics.totalKg} kg`} />
        <MiniBadge label="Recyclable Waste" value={`${analytics.recyclableKg} kg`} />
        <MiniBadge label="Non-Recyclable Waste" value={`${analytics.nonRecyclableKg} kg`} />
        <MiniBadge label="Recyclable Percentage" value={`${analytics.recyclablePercent}%`} />
      </div>
    </div>
  );
}

function ProgressRow({ label, value, percent }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium">{label}</span>
        <span className="text-gray-500">{value} • {percent}%</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className="bg-green-600 h-3 rounded-full" style={{ width: `${percent}%` }}></div>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="bg-gray-50 border rounded-2xl p-6 text-gray-500 text-sm">
      {text}
    </div>
  );
}


function StatCard({ title, value, note, icon, color }) {
  const styles = {
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-5">
        <div className={`w-13 h-13 rounded-2xl ${styles[color]} flex items-center justify-center p-3`}>
          {icon}
        </div>

        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">
          Live
        </span>
      </div>

      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-3xl font-bold mt-1">{value}</h3>
      <p className="text-sm text-gray-400 mt-2">{note}</p>
    </div>
  );
}

function MiniBadge({ label, value }) {
  return (
    <div className="bg-gray-50 border rounded-2xl p-3 mb-3">
      <p className="text-gray-500">{label}</p>
      <p className="font-bold text-green-700">{value}</p>
    </div>
  );
}

function TrendBar({ month, value, width }) {
  return (
    <div className="mb-5">
      <div className="flex justify-between text-sm mb-1">
        <span>{month}</span>
        <span>{value}</span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div className="bg-green-600 h-3 rounded-full" style={{ width }}></div>
      </div>
    </div>
  );
}

function getPercent(value, total) {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
}

function parseKg(value) {
  if (!value) return 0;
  const number = String(value).replace(/[^0-9.]/g, "");
  return Number(number) || 0;
}

function normalizeWasteType(type) {
  if (!type) return "Unspecified";
  return String(type).trim();
}

function isRecyclable(type) {
  const recyclableTypes = ["recyclable", "plastic", "metal", "glass", "bottle", "carton"];
  const lower = String(type || "").toLowerCase();
  return recyclableTypes.some((keyword) => lower.includes(keyword));
}

function calculateWasteAnalytics(records) {
  const totalKg = records.reduce((sum, record) => sum + parseKg(record.actual_weight), 0);

  const wasteMap = {};
  const monthMap = {};
  const barangayMap = {};

  records.forEach((record) => {
    const kg = parseKg(record.actual_weight);
    const wasteType = normalizeWasteType(record.waste_type);
    const barangay = record.route_name || "Unspecified";

    wasteMap[wasteType] = (wasteMap[wasteType] || 0) + kg;
    barangayMap[barangay] = (barangayMap[barangay] || 0) + kg;

    const date = record.collected_date || record.created_at;
    const month = date
      ? new Date(date).toLocaleDateString("en-PH", { month: "long", year: "numeric" })
      : "Unspecified";

    monthMap[month] = (monthMap[month] || 0) + kg;
  });

  const wasteTypes = Object.entries(wasteMap)
    .map(([type, kg]) => ({
      type,
      kg: Number(kg.toFixed(2)),
      percent: getPercent(kg, totalKg),
    }))
    .sort((a, b) => b.kg - a.kg);

  const recyclableKg = wasteTypes
    .filter((item) => isRecyclable(item.type))
    .reduce((sum, item) => sum + item.kg, 0);

  const nonRecyclableKg = Math.max(totalKg - recyclableKg, 0);

  const monthlyMax = Math.max(...Object.values(monthMap), 0);
  const monthly = Object.entries(monthMap)
    .map(([month, kg]) => ({
      month,
      kg: Number(kg.toFixed(2)),
      percent: getPercent(kg, monthlyMax),
    }))
    .slice(-6);

  const barangayRanking = Object.entries(barangayMap)
    .map(([barangay, kg]) => ({
      barangay,
      kg: Number(kg.toFixed(2)),
    }))
    .sort((a, b) => b.kg - a.kg)
    .slice(0, 5);

  return {
    totalKg: Number(totalKg.toFixed(2)),
    recyclableKg: Number(recyclableKg.toFixed(2)),
    nonRecyclableKg: Number(nonRecyclableKg.toFixed(2)),
    recyclablePercent: getPercent(recyclableKg, totalKg),
    topWasteType: wasteTypes[0]?.type || "",
    wasteTypes,
    monthly,
    barangayRanking,
  };
}

function getPageTitle(activeSection) {
  const titles = {
    dashboard: "LGU Admin Dashboard",
    reports: "Waste Reports",
    notifications: "Notifications",
    schedule: "Collection Schedule",
    analytics: "Waste Analytics",
    map: "Collection Map",
    leaderboard: "Barangay Leaderboard",
    users: "Manage Users",
  };

  return titles[activeSection];
}

function getPageSubtitle(activeSection) {
  const subtitles = {
    dashboard:
      "Monitor live barangay requests, collection schedules, and actual waste data.",
    reports:
      "Review, validate, and update submitted collection requests from barangay users.",
    notifications:
      "View request alerts, collection updates, and system notifications.",
    schedule:
      "Manage route schedules followed by the single LGU garbage truck.",
    analytics:
      "Analyze monthly collected waste, recyclable percentage, and waste composition.",
    map:
      "View collection point monitoring and request status distribution.",
    leaderboard:
      "View barangay ranking based on waste management performance.",
    users:
      "Manage authorized LGU, barangay, and collection staff accounts.",
  };

  return subtitles[activeSection];
}