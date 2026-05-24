import { useState } from "react";
import { PackageCheck, Lock } from "lucide-react";

export default function QuickStatusUpdate({ requests, onStatusChange }) {
  const [requestId, setRequestId] = useState("");
  const [status, setStatus] = useState("In Progress");
  const [message, setMessage] = useState("");

  const editableRequests = requests.filter(
    (request) => request.status !== "Collected"
  );

  async function handleUpdate() {
    if (!requestId) {
      setMessage("Please select a request.");
      return;
    }

    const selectedRequest = requests.find(
      (request) => String(request.id) === String(requestId)
    );

    if (!selectedRequest) {
      setMessage("Selected request was not found.");
      return;
    }

    if (selectedRequest.status === "Collected") {
      setMessage("This request is already collected and can no longer be changed.");
      return;
    }

    await onStatusChange(Number(requestId), status);
    setMessage("Status updated successfully.");
    setRequestId("");
    setStatus("In Progress");
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6 max-w-2xl">
      <h3 className="text-xl font-bold">Update Collection Status</h3>
      <p className="text-sm text-gray-500 mb-5">
        Update the current progress of the assigned pickup request.
      </p>

      {message && (
        <div className="mb-4 bg-green-100 text-green-700 px-4 py-3 rounded-2xl text-sm">
          {message}
        </div>
      )}

      {editableRequests.length === 0 && (
        <div className="mb-4 bg-gray-100 text-gray-600 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
          <Lock size={16} />
          No editable pickup requests available. Collected requests are finalized.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-600">
            Select Pickup Request
          </label>

          <select
            className="input-field"
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
          >
            <option value="">Select request</option>

            {editableRequests.map((request) => (
              <option key={request.id} value={request.id}>
                CR-{String(request.id).padStart(3, "0")} - {request.barangay} -{" "}
                {request.schedule_group || "No Route"} - {request.status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">
            Collection Status
          </label>

          <select
            className="input-field"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>In Progress</option>
            <option>Collected</option>
            <option>Missed</option>
          </select>
        </div>

        <button
          onClick={handleUpdate}
          disabled={!requestId}
          className="w-full bg-green-700 text-white px-5 py-3 rounded-2xl shadow hover:bg-green-800 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PackageCheck size={18} />
          Update Status
        </button>
      </div>
    </div>
  );
}