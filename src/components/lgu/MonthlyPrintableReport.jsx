import { useMemo, useState } from "react";
import { Printer, FileText } from "lucide-react";

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

  const recyclableKg = filteredRecords.reduce((sum, record) => {
    const kg = parseKg(record.actual_weight);
    return isRecyclable(record.waste_type) ? sum + kg : sum;
  }, 0);

  const nonRecyclableKg = Math.max(totalKg - recyclableKg, 0);

  const recyclablePercent =
    totalKg > 0 ? Math.round((recyclableKg / totalKg) * 100) : 0;

  const barangaysServed = new Set(
    filteredRecords.map(
      (record) => record.route_name || record.barangay || "Unspecified"
    )
  ).size;

  const wasteTypeSummary = filteredRecords.reduce((acc, record) => {
    const type = record.waste_type || "Unspecified";
    const kg = parseKg(record.actual_weight);

    acc[type] = (acc[type] || 0) + kg;
    return acc;
  }, {});

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
        <div className="text-center border-b pb-6">
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

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <ReportBox label="Total Records" value={filteredRecords.length} />
          <ReportBox
            label="Total Waste Collected"
            value={`${totalKg.toFixed(2)} kg`}
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
            value={`${recyclableKg.toFixed(2)} kg`}
          />
          <ReportBox
            label="Non-Recyclable Waste"
            value={`${nonRecyclableKg.toFixed(2)} kg`}
          />
          <ReportBox
            label="Recyclable Percentage"
            value={`${recyclablePercent}%`}
          />
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
                </tr>
              </thead>

              <tbody>
                {Object.entries(wasteTypeSummary).length === 0 && (
                  <tr>
                    <td className="p-3 text-gray-500" colSpan="3">
                      No waste records found for this month.
                    </td>
                  </tr>
                )}

                {Object.entries(wasteTypeSummary).map(([type, kg]) => (
                  <tr key={type} className="border-t">
                    <td className="p-3">{type}</td>
                    <td className="p-3">
                      {isRecyclable(type) ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Recyclable
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          Non-Recyclable
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-semibold">{kg.toFixed(2)} kg</td>
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
                        : "N/A"}
                    </td>

                    <td className="p-3">
                      {formatDate(record.collected_date || record.created_at)}
                    </td>

                    <td className="p-3">
                      {record.route_name || record.barangay || "Unspecified"}
                    </td>

                    <td className="p-3">
                      {record.waste_type || "Unspecified"}
                    </td>

                    <td className="p-3 font-semibold">
                      {parseKg(record.actual_weight).toFixed(2)} kg
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
            <p className="text-sm font-semibold mt-2">MENRO / LGU Admin</p>
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

function ReportBox({ label, value }) {
  return (
    <div className="border rounded-2xl p-4 bg-gray-50">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

function parseKg(value) {
  if (!value) return 0;

  const number = String(value).replace(/[^0-9.]/g, "");
  return Number(number) || 0;
}

function isRecyclable(type) {
  const recyclableTypes = ["recyclable", "plastic", "metal", "glass"];

  const lower = String(type || "").toLowerCase();

  return recyclableTypes.some((keyword) => lower.includes(keyword));
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