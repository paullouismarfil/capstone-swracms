import { formatKg } from "./helpers";
import { Truck } from "lucide-react";

export default function CollectionHistory({ records = [], full }) {
  return (
    <div
      className={`${
        full ? "" : "xl:col-span-3"
      } bg-white rounded-3xl shadow-sm border overflow-hidden`}
    >
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Recent Collection Records</h3>
          <p className="text-sm text-gray-500">
            Actual waste collection records encoded by collection staff.
          </p>
        </div>

        <button className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm">
          History
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1150px]">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="p-4 text-left">Record ID</th>
              <th className="p-4 text-left">Request Ref.</th>
              <th className="p-4 text-left">Route / Barangay</th>
              <th className="p-4 text-left">Waste Type</th>
              <th className="p-4 text-left">Actual Weight</th>
              <th className="p-4 text-left">Vehicle / Truck Used</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Photo</th>
              <th className="p-4 text-left">Remarks</th>
            </tr>
          </thead>

          <tbody>
            {records.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="9">
                  No collection records yet.
                </td>
              </tr>
            )}

            {records.map((record) => (
              <tr key={record.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-semibold text-green-700">
                  REC-{formatShortId(record.id)}
                </td>

                <td className="p-4 text-gray-600">
                  {record.request_id ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      CR-{formatShortId(record.request_id)}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">
                      No request ref.
                    </span>
                  )}
                </td>

                <td className="p-4 font-semibold">
                  {record.route_name || record.barangay || "Unspecified"}
                </td>

                <td className="p-4">
                  {record.waste_type || "Unspecified"}
                </td>

                <td className="p-4 font-bold text-green-700">
                  {formatKg(record.actual_weight)}
                </td>

                <td className="p-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    <Truck size={13} />
                    {record.vehicle || "LGU Garbage Truck"}
                  </span>
                </td>

                <td className="p-4 text-gray-500">
                  {formatDate(record.collected_date || record.created_at)}
                </td>

                <td className="p-4">
                  {record.photo_url ? (
                    <a
                      href={record.photo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-700 font-semibold text-sm"
                    >
                      View Photo
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">No photo</span>
                  )}
                </td>

                <td className="p-4 text-gray-600">
                  {record.remarks || "No remarks"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}