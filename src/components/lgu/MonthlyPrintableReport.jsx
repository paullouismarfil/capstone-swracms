import { useMemo, useState } from "react";
import { Printer, FileText } from "lucide-react";

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

export default function MonthlyPrintableReport({ records = [] }) {
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const dateValue = record.collected_date || record.created_at;
      if (!dateValue) return false;

      const date = new Date(dateValue);

      return (
        date.getMonth() === Number(selectedMonth) &&
        date.getFullYear() === Number(selectedYear)
      );
    });
  }, [records, selectedMonth, selectedYear]);

  const totalKg = filteredRecords.reduce(
    (sum, record) => sum + parseKg(record.actual_weight),
    0
  );

  const wasteTypeSummary = useMemo(() => {
    return calculateWasteTypeSummary(filteredRecords);
  }, [filteredRecords]);

  const wasteChartData = useMemo(() => {
    return Object.entries(wasteTypeSummary)
      .map(([rawType, kg]) => {
        const type = normalizeWasteType(rawType);
        const config = getWasteTypeConfig(type);

        return {
          type,
          kg,
          percent: totalKg > 0 ? Math.round((kg / totalKg) * 100) : 0,
          category: config.category,
          color: config.color,
        };
      })
      .sort((a, b) => {
        const aIndex = WASTE_TYPE_ORDER.indexOf(a.type);
        const bIndex = WASTE_TYPE_ORDER.indexOf(b.type);

        const safeAIndex = aIndex === -1 ? 999 : aIndex;
        const safeBIndex = bIndex === -1 ? 999 : bIndex;

        return safeAIndex - safeBIndex;
      });
  }, [wasteTypeSummary, totalKg]);

  const recyclableKg = wasteChartData
    .filter((item) => item.category === "Recyclable")
    .reduce((sum, item) => sum + item.kg, 0);

  const nonRecyclableKg = Math.max(totalKg - recyclableKg, 0);

  const recyclablePercent =
    totalKg > 0 ? Math.round((recyclableKg / totalKg) * 100) : 0;

  const barangaysServed = new Set(
    filteredRecords.map(
      (record) => record.route_name || record.barangay || "Unspecified"
    )
  ).size;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:hidden">
        <div>
          <h3 className="text-2xl font-bold">Monthly Printable Report</h3>
          <p className="text-sm text-gray-500 mt-1">
            Generate and print monthly waste collection records.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 bg-green-700 text-white px-5 py-3 rounded-2xl shadow hover:bg-green-800 transition"
        >
          <Printer size={18} />
          Print / Save as PDF
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border p-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Select Month
            </label>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-2 w-full border rounded-2xl px-4 py-3 outline-none focus:border-green-500"
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Select Year
            </label>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="mt-2 w-full border rounded-2xl px-4 py-3 outline-none focus:border-green-500"
            >
              {[2024, 2025, 2026, 2027, 2028].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
            <p className="text-sm text-green-700">Selected Period</p>
            <p className="text-xl font-bold text-green-900">
              {monthNames[selectedMonth]} {selectedYear}
            </p>
          </div>
        </div>
      </div>

      <div
        id="monthly-report-print-area"
        className="bg-white rounded-3xl shadow-sm border p-8"
      >
        <div className="relative border-b pb-6">
          <img
            src="/menro-logo.jpg"
            alt="MENRO Logo"
            className="w-20 h-20 object-contain mx-auto mb-3"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />

          <div className="text-center">
            <p className="text-sm font-semibold uppercase">
              Republic of the Philippines
            </p>
            <p className="text-sm">Province of Antique</p>
            <p className="text-sm">Municipality of Sibalom</p>

            <h1 className="text-2xl font-bold mt-5">
              MENRO Monthly Waste Collection Report
            </h1>

            <p className="text-gray-600 mt-1">
              For the Month of {monthNames[selectedMonth]} {selectedYear}
            </p>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <ReportBox label="Total Records" value={filteredRecords.length} />
          <ReportBox
            label="Total Waste Collected"
            value={`${formatKg(totalKg)} kg`}
          />
          <ReportBox
            label="Barangays / Routes Served"
            value={barangaysServed}
          />
          <ReportBox label="Report Status" value="Generated" />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <ReportBox
            label="Recyclable Waste"
            value={`${formatKg(recyclableKg)} kg`}
          />
          <ReportBox
            label="Non-Recyclable Waste"
            value={`${formatKg(nonRecyclableKg)} kg`}
          />
          <ReportBox
            label="Recyclable Percentage"
            value={`${recyclablePercent}%`}
          />
        </section>

        <section className="mt-8">
          <div className="border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold">
                  Waste Composition Pie Graph
                </h2>
                <p className="text-sm text-gray-500">
                  Percentage distribution of collected waste by type for the
                  selected month.
                </p>
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                <FileText size={16} />
                Monthly visual summary
              </div>
            </div>

            {wasteChartData.length === 0 ? (
              <div className="bg-gray-50 border rounded-2xl p-6 text-gray-500 text-sm">
                No waste composition data available for this selected month.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                <div className="flex justify-center">
                  <WastePieChart data={wasteChartData} totalKg={totalKg} />
                </div>

                <div className="space-y-3">
                  {wasteChartData.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between gap-3 border rounded-2xl p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />

                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {item.type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.category}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">
                          {formatKg(item.kg)} kg
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.percent}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-bold mb-3">Waste Type Summary</h2>

          <div className="border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3">Waste Type</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Total Weight</th>
                  <th className="text-left p-3">Percentage</th>
                </tr>
              </thead>

              <tbody>
                {wasteChartData.length === 0 && (
                  <tr>
                    <td className="p-3 text-gray-500" colSpan="4">
                      No waste records found for this month.
                    </td>
                  </tr>
                )}

                {wasteChartData.map((item) => (
                  <tr key={item.type} className="border-t">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.type}</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.category === "Recyclable"
                            ? "bg-green-100 text-green-700"
                            : item.category === "Non-Recyclable"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>

                    <td className="p-3 font-semibold">
                      {formatKg(item.kg)} kg
                    </td>

                    <td className="p-3 font-semibold">{item.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-bold mb-3">Collection Records</h2>

          <div className="border rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3">Request Ref.</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Barangay / Route</th>
                  <th className="text-left p-3">Waste Type</th>
                  <th className="text-left p-3">Weight</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.length === 0 && (
                  <tr>
                    <td className="p-3 text-gray-500" colSpan="5">
                      No collection records available for this selected month.
                    </td>
                  </tr>
                )}

                {filteredRecords.map((record) => (
                  <tr key={record.id} className="border-t">
                    <td className="p-3">
                      {record.request_id
                        ? `CR-${formatShortId(record.request_id)}`
                        : "Manual Record"}
                    </td>

                    <td className="p-3">
                      {formatDate(record.collected_date || record.created_at)}
                    </td>

                    <td className="p-3">
                      {record.route_name || record.barangay || "Unspecified"}
                    </td>

                    <td className="p-3">
                      {normalizeWasteType(record.waste_type || "Unspecified")}
                    </td>

                    <td className="p-3 font-semibold">
                      {formatKg(record.actual_weight)} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div>
            <p className="text-sm text-gray-500">Prepared by:</p>
            <div className="border-b mt-10"></div>
            <p className="text-sm font-semibold mt-2">MENRO Admin</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Approved by:</p>
            <div className="border-b mt-10"></div>
            <p className="text-sm font-semibold mt-2">Municipal Authority</p>
          </div>
        </section>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }

          #monthly-report-print-area,
          #monthly-report-print-area * {
            visibility: visible;
          }

          #monthly-report-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

function WastePieChart({ data, totalKg }) {
  const size = 230;
  const center = size / 2;
  const radius = 86;
  const strokeWidth = 42;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  if (!data.length || totalKg <= 0) {
    return (
      <div className="w-[230px] h-[230px] rounded-full border flex items-center justify-center text-sm text-gray-500">
        No Data
      </div>
    );
  }

  return (
    <div className="relative w-[230px] h-[230px]">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />

        {data.map((item) => {
          const percent = totalKg > 0 ? item.kg / totalKg : 0;
          const dash = percent * circumference;
          const gap = circumference - dash;
          const offset = -cumulativePercent * circumference;

          cumulativePercent += percent;

          return (
            <circle
              key={item.type}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${center} ${center})`}
            />
          );
        })}

        <circle cx={center} cy={center} r={46} fill="white" />

        <text
          x={center}
          y={center - 5}
          textAnchor="middle"
          className="fill-gray-900"
          style={{ fontSize: "22px", fontWeight: "700" }}
        >
          {formatKg(totalKg)}
        </text>

        <text
          x={center}
          y={center + 18}
          textAnchor="middle"
          className="fill-gray-500"
          style={{ fontSize: "12px" }}
        >
          kg total
        </text>
      </svg>
    </div>
  );
}

function ReportBox({ label, value }) {
  return (
    <div className="border rounded-2xl p-4 bg-gray-50">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

function calculateWasteTypeSummary(records) {
  return records.reduce((acc, record) => {
    const kg = parseKg(record.actual_weight);
    const types = splitWasteTypes(record.waste_type);
    const kgPerType = types.length > 0 ? kg / types.length : kg;

    types.forEach((rawType) => {
      const type = normalizeWasteType(rawType);
      acc[type] = (acc[type] || 0) + kgPerType;
    });

    return acc;
  }, {});
}

function splitWasteTypes(type) {
  if (!type) return ["Unspecified"];

  const types = String(type)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return types.length > 0 ? types : ["Unspecified"];
}

function parseKg(value) {
  if (!value) return 0;

  const number = String(value).replace(/[^0-9.]/g, "");
  return Number(number) || 0;
}

function formatKg(value) {
  const number = parseKg(value);

  if (Number.isInteger(number)) {
    return String(number);
  }

  return String(Number(number.toFixed(2)));
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

function formatShortId(value) {
  if (!value) return "000";

  const text = String(value);

  if (text.length <= 6) {
    return text.padStart(3, "0");
  }

  return text.slice(0, 8).toUpperCase();
}

function formatDate(dateValue) {
  if (!dateValue) return "N/A";

  return new Date(dateValue).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];