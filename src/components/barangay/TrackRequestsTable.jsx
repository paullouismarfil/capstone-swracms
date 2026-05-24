import StatusBadge from "./StatusBadge";
import { formatDate, formatKg } from "./helpers";

export default function TrackRequestsTable({ requests, loading, full }) {
  return (
    <div
      className={`${
        full ? "" : "xl:col-span-2"
      } bg-white rounded-3xl shadow-sm border overflow-hidden`}
    >
      <div className="p-6 border-b">
        <h3 className="text-xl font-bold">Track Collection Requests</h3>
        <p className="text-sm text-gray-500">
          Monitor submitted pickup requests and collection progress.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px]">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="p-4 text-left">Request ID</th>
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">Collection Point</th>
              <th className="p-4 text-left">Waste Type</th>
              <th className="p-4 text-left">Estimated</th>
              <th className="p-4 text-left">Route</th>
              <th className="p-4 text-left">Photos</th>
              <th className="p-4 text-left">Date Submitted</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="9">
                  Loading requests...
                </td>
              </tr>
            )}

            {!loading && requests.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="9">
                  No collection requests yet.
                </td>
              </tr>
            )}

            {!loading &&
              requests.map((request) => {
                const photos = request.image_urls || [];

                return (
                  <tr key={request.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-semibold text-green-700">
                      CR-{String(request.id).padStart(3, "0")}
                    </td>

                    <td className="p-4">{request.request_title}</td>
                    <td className="p-4 text-gray-600">
                      {request.collection_point}
                    </td>
                    <td className="p-4">{request.waste_type}</td>

                    <td className="p-4 font-semibold">
                      {formatKg(request.estimated_weight)}
                    </td>

                    <td className="p-4 text-gray-600">
                      {request.schedule_group || "N/A"}
                    </td>

                    <td className="p-4">
                      {photos.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {photos.slice(0, 3).map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-green-700 font-semibold text-sm"
                            >
                              Photo {index + 1}
                            </a>
                          ))}

                          {photos.length > 3 && (
                            <span className="text-gray-500 text-sm">
                              +{photos.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : request.image_url ? (
                        <a
                          href={request.image_url}
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

                    <td className="p-4 text-gray-500">
                      {formatDate(request.created_at)}
                    </td>

                    <td className="p-4">
                      <StatusBadge status={request.status} />
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