import { X } from "lucide-react";

export default function RequestDetailsModal({
  request,
  onClose,
  onStatusChange,
}) {
  const photos = request.image_urls?.length
    ? request.image_urls
    : request.image_url
    ? [request.image_url]
    : [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-auto rounded-3xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
        >
          <X size={20} />
        </button>

        <div className="pr-12">
          <h3 className="text-2xl font-bold">
            CR-{String(request.id).padStart(3, "0")} Review
          </h3>
          <p className="text-gray-500 mt-1">
            Review submitted barangay collection request.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <DetailBox label="Barangay" value={request.barangay} />
          <DetailBox label="Request Title" value={request.request_title} />
          <DetailBox label="Collection Point" value={request.collection_point} />
          <DetailBox label="Waste Type" value={request.waste_type} />
          <DetailBox label="Estimated Weight" value={formatKg(request.estimated_weight)} />
          <DetailBox label="Schedule Group" value={request.schedule_group || "N/A"} />
          <DetailBox label="Allowed Waste Category" value={request.allowed_waste_category || "N/A"} />
          <DetailBox label="Route Schedule" value={request.route_schedule || "N/A"} />
          <DetailBox label="Sacks / Containers" value={request.sacks_count || "N/A"} />
          <DetailBox label="Preferred Pickup Date" value={request.preferred_pickup_date || "N/A"} />
          <DetailBox label="Status" value={request.status} />
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-600 mb-2">Remarks</p>
          <div className="bg-gray-50 border rounded-2xl p-4 text-gray-700">
            {request.remarks || "No remarks provided."}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-600 mb-3">
            Photo Evidence
          </p>

          {photos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((url, index) => (
                <a href={url} target="_blank" rel="noreferrer" key={index}>
                  <img
                    src={url}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-48 object-cover rounded-2xl border hover:opacity-90"
                  />
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border rounded-2xl p-4 text-gray-500">
              No photo evidence uploaded.
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 justify-end mt-7">
          <button
            onClick={() => onStatusChange(request.id, "Pending")}
            className="px-5 py-3 rounded-2xl bg-orange-100 text-orange-700 font-semibold"
          >
            Set Pending
          </button>

          <button
            onClick={() => onStatusChange(request.id, "Scheduled")}
            className="px-5 py-3 rounded-2xl bg-blue-100 text-blue-700 font-semibold"
          >
            Schedule
          </button>

          <button
            onClick={() => onStatusChange(request.id, "Collected")}
            className="px-5 py-3 rounded-2xl bg-green-700 text-white font-semibold"
          >
            Mark Collected
          </button>

          <button
            onClick={() => onStatusChange(request.id, "Missed")}
            className="px-5 py-3 rounded-2xl bg-red-100 text-red-700 font-semibold"
          >
            Mark Missed
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailBox({ label, value }) {
  return (
    <div className="bg-gray-50 border rounded-2xl p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold mt-1">{value}</p>
    </div>
  );
}

function formatKg(value) {
  if (value === null || value === undefined || value === "") return "N/A";

  const text = String(value).trim();

  if (text.toLowerCase().includes("kg")) return text;

  return `${text} kg`;
}