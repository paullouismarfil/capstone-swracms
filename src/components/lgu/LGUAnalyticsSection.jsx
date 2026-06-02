import { FileText, Scale, Recycle, ChartPie } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const WASTE_TYPE_CONFIG = {
  Recyclable: {
    color: "#16a34a",
    category: "Recyclable",
  },
  Plastic: {
    color: "#2563eb",
    category: "Recyclable",
  },
  Metal: {
    color: "#0d9488",
    category: "Recyclable",
  },
  Glass: {
    color: "#0891b2",
    category: "Recyclable",
  },
  Biodegradable: {
    color: "#f97316",
    category: "Non-Recyclable",
  },
  Residual: {
    color: "#dc2626",
    category: "Non-Recyclable",
  },
  "Mixed Waste": {
    color: "#4b5563",
    category: "Non-Recyclable",
  },
  Unspecified: {
    color: "#94a3b8",
    category: "Unspecified",
  },
};

const WASTE_TYPE_ORDER = [
  "Recyclable",
  "Plastic",
  "Metal",
  "Glass",
  "Biodegradable",
  "Residual",
  "Mixed Waste",
  "Unspecified",
];

export default function LGUAnalyticsSection({ analytics, records }) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          title="Total Waste Collected"
          value={`${formatKg(analytics.totalKg)} kg`}
          note="Actual recorded waste"
          icon={<Scale size={26} />}
          color="green"
        />

        <StatCard
          title="Recyclable Waste"
          value={`${analytics.recyclablePercent}%`}
          note="Recyclable, plastic, metal, and glass"
          icon={<Recycle size={26} />}
          color="blue"
        />

        <StatCard
          title="Top Waste Type"
          value={analytics.topWasteType || "N/A"}
          note="Most recorded category"
          icon={<ChartPie size={26} />}
          color="orange"
        />

        <StatCard
          title="Collection Records"
          value={records.length}
          note="Encoded by collection staff"
          icon={<FileText size={26} />}
          color="green"
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <LGUWasteCompositionCard analytics={analytics} />
        <MonthlyWasteTrend analytics={analytics} />
        <BarangayWasteRanking analytics={analytics} />
        <WasteTypeTable analytics={analytics} />
      </section>
    </div>
  );
}

export function LGUWasteCompositionCard({ analytics }) {
  const sortedWasteTypes = getSortedWasteTypes(analytics.wasteTypes);

  const chartData = sortedWasteTypes.map((item) => {
    const type = normalizeWasteType(item.type);
    const config = getWasteTypeConfig(type);

    return {
      name: type,
      value: Number(item.kg) || 0,
      percent: item.percent,
      color: config.color,
      category: config.category,
    };
  });

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
                  label={({ payload }) => `${payload.name} ${payload.percent}%`}
                >
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value, name) => [
                    `${formatKg(value)} kg`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 space-y-4">
            {chartData.map((item) => (
              <ProgressRow
                key={item.name}
                label={item.name}
                value={`${formatKg(item.value)} kg`}
                percent={item.percent}
                color={item.color}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function LGUAnalyticsSummaryCard({ analytics }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6">
      <h3 className="text-xl font-bold">Recyclable Monitoring</h3>
      <p className="text-sm text-gray-500 mb-6">
        Summary of recyclable and non-recyclable collected waste.
      </p>

      <div className="space-y-4">
        <MiniBadge
          label="Total Actual Waste"
          value={`${formatKg(analytics.totalKg)} kg`}
        />
        <MiniBadge
          label="Recyclable Waste"
          value={`${formatKg(analytics.recyclableKg)} kg`}
        />
        <MiniBadge
          label="Non-Recyclable Waste"
          value={`${formatKg(analytics.nonRecyclableKg)} kg`}
        />
        <MiniBadge
          label="Recyclable Percentage"
          value={`${analytics.recyclablePercent}%`}
        />
      </div>
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
              value={`${formatKg(item.kg)} kg`}
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
            <div
              key={item.barangay}
              className="flex items-center justify-between p-4 rounded-2xl border hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-100 text-green-700 flex items-center justify-center font-bold">
                  #{index + 1}
                </div>

                <div>
                  <p className="font-semibold">{item.barangay}</p>
                  <p className="text-xs text-gray-500">Total collected waste</p>
                </div>
              </div>

              <p className="font-bold text-green-700">
                {formatKg(item.kg)} kg
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WasteTypeTable({ analytics }) {
  const sortedWasteTypes = getSortedWasteTypes(analytics.wasteTypes);

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
            {sortedWasteTypes.length === 0 && (
              <tr>
                <td colSpan="4" className="p-4 text-gray-500">
                  No waste records yet.
                </td>
              </tr>
            )}

            {sortedWasteTypes.map((item) => {
              const type = normalizeWasteType(item.type);
              const config = getWasteTypeConfig(type);

              return (
                <tr key={type} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-semibold">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: config.color }}
                      />
                      {type}
                    </div>
                  </td>

                  <td className="p-4 font-bold" style={{ color: config.color }}>
                    {formatKg(item.kg)} kg
                  </td>

                  <td className="p-4">{item.percent}%</td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        config.category === "Recyclable"
                          ? "bg-green-100 text-green-700"
                          : config.category === "Non-Recyclable"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {config.category}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, percent, color }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="font-medium">{label}</span>
        <span className="text-gray-500">
          {value} • {percent}%
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="h-3 rounded-full"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
          }}
        ></div>
      </div>
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
        <div
          className={`w-13 h-13 rounded-2xl ${styles[color]} flex items-center justify-center p-3`}
        >
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

function getSortedWasteTypes(wasteTypes = []) {
  return [...wasteTypes]
    .map((item) => ({
      ...item,
      type: normalizeWasteType(item.type),
    }))
    .sort((a, b) => {
      const aIndex = WASTE_TYPE_ORDER.indexOf(a.type);
      const bIndex = WASTE_TYPE_ORDER.indexOf(b.type);

      const safeAIndex = aIndex === -1 ? 999 : aIndex;
      const safeBIndex = bIndex === -1 ? 999 : bIndex;

      return safeAIndex - safeBIndex;
    });
}

function normalizeWasteType(type) {
  const lower = String(type || "").trim().toLowerCase();

  if (lower.includes("plastic")) return "Plastic";
  if (lower.includes("metal")) return "Metal";
  if (lower.includes("glass")) return "Glass";
  if (lower.includes("bio")) return "Biodegradable";
  if (lower.includes("residual")) return "Residual";
  if (lower.includes("mixed")) return "Mixed Waste";
  if (lower.includes("recyclable")) return "Recyclable";

  return String(type || "Unspecified").trim() || "Unspecified";
}

function getWasteTypeConfig(type) {
  return (
    WASTE_TYPE_CONFIG[type] || {
      color: "#94a3b8",
      category: isRecyclable(type) ? "Recyclable" : "Non-Recyclable",
    }
  );
}

function isRecyclable(type) {
  const lower = String(type || "").toLowerCase();

  return (
    lower.includes("recyclable") ||
    lower.includes("plastic") ||
    lower.includes("metal") ||
    lower.includes("glass")
  );
}

function formatKg(value) {
  const number = Number(value) || 0;

  if (Number.isInteger(number)) {
    return String(number);
  }

  return String(Number(number.toFixed(2)));
}