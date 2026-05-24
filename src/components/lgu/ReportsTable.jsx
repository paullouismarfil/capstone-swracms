import { Eye, Lock } from "lucide-react";

export default function ReportsTable({
  reports,
  loading,
  full,
  onView,
  onStatusChange,
}) {
  return (
    <div
      className={`${
        full ? "" : "xl:col-span-2"
      } bg-white rounded-3xl shadow-sm border overflow-hidden`}
    >
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Waste Reports</h3>
          <p className="text-sm text-gray-500">
            Live collection requests submitted by barangay users.
          </p>
        </div>

        <button className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm">
          Live Data
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1250px]">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="p-4 text-left">Request ID</th>
              <th className="p-4 text-left">Barangay</th>
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">Waste Type</th>
              <th className="p-4 text-left">Route Group</th>
              <th className="p-4 text-left">Allowed Waste</th>
              <th className="p-4 text-left">Estimated</th>
              <th className="p-4 text-left">Photos</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="11">
                  Loading requests...
                </td>
              </tr>
            )}

            {!loading && reports.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="11">
                  No submitted requests yet.
                </td>
              </tr>
            )}

            {!loading &&
              reports.map((report) => {
                const photos = report.image_urls || [];
                const isCollected = report.status === "Collected";

                return (
                  <tr key={report.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-semibold text-green-700">
                      CR-{String(report.id).padStart(3, "0")}
                    </td>

                    <td className="p-4 font-semibold">{report.barangay}</td>

                    <td className="p-4">{report.request_title}</td>

                    <td className="p-4 text-gray-600">{report.waste_type}</td>

                    <td className="p-4">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {report.schedule_group || "N/A"}
                      </span>
                    </td>

                    <td className="p-4 text-gray-600">
                      {report.allowed_waste_category || "N/A"}
                    </td>

                    <td className="p-4 font-semibold">
                      {formatKg(report.estimated_weight)}
                    </td>

                    <td className="p-4">
                      {photos.length > 0 ? (
                        <button
                          onClick={() => onView(report)}
                          className="text-green-700 font-semibold text-sm"
                        >
                          {photos.length} photo(s)
                        </button>
                      ) : report.image_url ? (
                        <button
                          onClick={() => onView(report)}
                          className="text-green-700 font-semibold text-sm"
                        >
                          View Photo
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">No photo</span>
                      )}
                    </td>

                    <td className="p-4 text-gray-500">
                      {formatDate(report.created_at)}
                    </td>

                    <td className="p-4">
                      <StatusBadge status={report.status} />
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2 flex-wrap items-center">
                        <button
                          onClick={() => onView(report)}
                          className="text-green-700 font-semibold text-sm flex items-center gap-1"
                        >
                          <Eye size={15} />
                          Review
                        </button>

                        {isCollected ? (
                          <span className="inline-flex items-center gap-1 text-gray-500 font-semibold text-sm">
                            <Lock size={14} />
                            Finalized
                          </span>
                        ) : (
                          <>
                            {report.status === "Pending" && (
                              <button
                                onClick={() =>
                                  onStatusChange(report.id, "Scheduled")
                                }
                                className="text-blue-700 font-semibold text-sm"
                              >
                                Schedule
                              </button>
                            )}

                            {report.status === "Scheduled" && (
                              <button
                                onClick={() =>
                                  onStatusChange(report.id, "Collected")
                                }
                                className="text-green-700 font-semibold text-sm"
                              >
                                Mark Collected
                              </button>
                            )}

                            {report.status !== "Missed" && (
                              <button
                                onClick={() =>
                                  onStatusChange(report.id, "Missed")
                                }
                                className="text-red-600 font-semibold text-sm"
                              >
                                Missed
                              </button>
                            )}
                          </>
                        )}
                      </div>
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

function StatusBadge({ status }) {
  const style =
    status === "Collected"
      ? "bg-green-100 text-green-700"
      : status === "Scheduled"
      ? "bg-blue-100 text-blue-700"
      : status === "Missed"
      ? "bg-red-100 text-red-600"
      : "bg-orange-100 text-orange-600";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}

function formatDate(dateValue) {
  if (!dateValue) return "N/A";

  return new Date(dateValue).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatKg(value) {
  if (value === null || value === undefined || value === "") return "N/A";

  const text = String(value).trim();

  if (text.toLowerCase().includes("kg")) return text;

  return `${text} kg`;
}