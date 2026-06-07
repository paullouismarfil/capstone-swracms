import { useState } from "react";
import {
  PackageCheck,
  Lock,
  AlertTriangle,
  MapPin,
  CalendarDays,
  Trash2,
  Scale,
  Truck,
} from "lucide-react";

export default function QuickStatusUpdate({ requests, onStatusChange }) {
  const [requestId, setRequestId] = useState("");
  const [status, setStatus] = useState("In Progress");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const editableRequests = requests.filter(
    (request) =>
      request.status !== "Collected" &&
      request.status !== "Improper Segregation" &&
      !request.needsReschedule
  );

  const selectedRequest = requests.find(
    (request) => String(request.id) === String(requestId)
  );

  async function handleUpdate() {
    setMessage("");
    setMessageType("");

    if (!requestId) {
      setMessage("Please select a request.");
      setMessageType("error");
      return;
    }

    if (!selectedRequest) {
      setMessage("Selected request was not found.");
      setMessageType("error");
      return;
    }

    if (selectedRequest.needsReschedule) {
      setMessage(
        "This request needs rescheduling. Please wait for LGU/MENRO to assign a new schedule or available truck."
      );
      setMessageType("error");
      return;
    }

    if (
      selectedRequest.status === "Collected" ||
      selectedRequest.status === "Improper Segregation"
    ) {
      setMessage("This request is already finalized and can no longer be changed.");
      setMessageType("error");
      return;
    }

    if (status === "Collected") {
      setMessage(
        "Please use the Waste Recording page to mark this request as collected, so you can enter the actual kg per waste type."
      );
      setMessageType("error");
      return;
    }

    await onStatusChange(String(requestId), status);

    if (status === "Improper Segregation") {
      setMessage(
        "Status updated. Waste was marked as not collected due to improper segregation."
      );
      setMessageType("success");
    } else if (status === "Missed") {
      setMessage("Status updated. Request was marked as missed.");
      setMessageType("success");
    } else {
      setMessage("Status updated successfully.");
      setMessageType("success");
    }

    setRequestId("");
    setStatus("In Progress");
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6 max-w-3xl">
      <h3 className="text-xl font-bold">Update Collection Status</h3>

      <p className="text-sm text-gray-500 mb-5">
        Update the current progress of the assigned pickup request.
      </p>

      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-2xl text-sm ${
            messageType === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {requests.some((request) => request.needsReschedule) && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-start gap-2">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>
            Some requests need rescheduling because the assigned truck is
            unavailable and the backup truck is already active. These requests
            are hidden from quick status updates until MENRO reschedules them.
          </p>
        </div>
      )}

      {editableRequests.length === 0 && (
        <div className="mb-4 bg-gray-100 text-gray-600 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
          <Lock size={16} />
          No editable pickup requests available. Collected, improper
          segregation, and reschedule-required records cannot be updated here.
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
            onChange={(e) => {
              setRequestId(e.target.value);
              setMessage("");
              setMessageType("");
            }}
          >
            <option value="">Select request</option>

            {editableRequests.map((request) => (
              <option key={request.id} value={request.id}>
                CR-{String(request.id).padStart(3, "0")} - {request.barangay} -{" "}
                {request.assignedTruck
                  ? `${request.assignedTruck.name}`
                  : request.schedule_group || "No Route"}{" "}
                - {request.status}
              </option>
            ))}
          </select>
        </div>

        {selectedRequest && (
          <div className="bg-green-50 border border-green-100 rounded-3xl p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-sm text-green-700 font-semibold">
                  Selected Barangay Request
                </p>

                <h4 className="text-xl font-bold text-green-950 mt-1">
                  {selectedRequest.barangay || "Unspecified Barangay"}
                </h4>

                <p className="text-sm text-gray-600 mt-1">
                  CR-{String(selectedRequest.id).padStart(3, "0")} •{" "}
                  {selectedRequest.status || "No status"}
                </p>
              </div>

              <span className="px-4 py-2 rounded-full bg-white border text-sm font-semibold text-green-700">
                {selectedRequest.schedule_group || "No Route"}
              </span>
            </div>

            {selectedRequest.needsReschedule && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm flex items-start gap-2">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Needs Reschedule</p>
                  <p className="mt-1">
                    {selectedRequest.rescheduleReason ||
                      "This request requires LGU/MENRO rescheduling before collection."}
                  </p>
                </div>
              </div>
            )}

            {selectedRequest.assignedTruck && (
              <div className="mt-4 bg-white border rounded-2xl p-4 flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor:
                      selectedRequest.assignedTruck.color || "#15803d",
                  }}
                >
                  <Truck size={18} />
                </div>

                <div>
                  <p className="text-xs text-gray-500">Assigned Truck</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {selectedRequest.assignedTruck.name} -{" "}
                    {selectedRequest.assignedTruck.label ||
                      selectedRequest.assignedTruck.shortLabel}
                  </p>

                  <p className="text-xs text-gray-600 mt-1">
                    Assigned Waste:{" "}
                    <span className="font-semibold">
                      {selectedRequest.assignedTruck.assignedWaste ||
                        "Not specified"}
                    </span>
                  </p>

                  {selectedRequest.isReassignedToBackup && (
                    <p className="text-xs text-red-600 font-semibold mt-2">
                      Backup route from{" "}
                      {selectedRequest.originalAssignedTruck?.name ||
                        "main truck"}
                      . This request was reassigned because the original truck is
                      unavailable.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
              <RequestInfo
                icon={<Trash2 size={17} />}
                label="Requested Waste Type"
                value={selectedRequest.waste_type || "Unspecified"}
              />

              <RequestInfo
                icon={<Scale size={17} />}
                label="Estimated Weight"
                value={`${
                  selectedRequest.actual_weight ||
                  selectedRequest.estimated_weight ||
                  selectedRequest.weight ||
                  selectedRequest.quantity ||
                  0
                } kg`}
              />

              <RequestInfo
                icon={<MapPin size={17} />}
                label="Collection Point"
                value={selectedRequest.collection_point || "No collection point"}
              />

              <RequestInfo
                icon={<CalendarDays size={17} />}
                label="Route Schedule"
                value={selectedRequest.route_schedule || "No route schedule"}
              />
            </div>

            <div className="mt-4 bg-white border rounded-2xl p-4">
              <p className="text-xs text-gray-500">Reminder</p>
              <p className="text-sm text-gray-700 mt-1">
                Use this page for quick status updates like{" "}
                <strong>In Progress</strong>, <strong>Missed</strong>, or{" "}
                <strong>Improper Segregation</strong>. For collected waste, use{" "}
                <strong>Waste Recording</strong> so the actual kg per waste type
                can be recorded correctly.
              </p>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-600">
            Collection Status
          </label>

          <select
            className="input-field"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setMessage("");
              setMessageType("");
            }}
          >
            <option value="In Progress">In Progress</option>
            <option value="Improper Segregation">
              Not Collected - Improper Segregation
            </option>
            <option value="Missed">Missed</option>
            <option value="Collected">Collected - Use Waste Recording</option>
          </select>
        </div>

        {status === "Collected" && (
          <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-2xl text-sm flex items-start gap-2">
            <PackageCheck size={18} className="shrink-0 mt-0.5" />

            <p>
              To mark this as collected, please go to{" "}
              <strong>Waste Recording</strong> and enter the actual kg for each
              waste type. This keeps the analytics and monthly report accurate.
            </p>
          </div>
        )}

        {status === "Improper Segregation" && (
          <div className="bg-orange-50 border border-orange-100 text-orange-700 px-4 py-3 rounded-2xl text-sm flex items-start gap-2">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />

            <p>
              This will mark the request as not collected because the waste was
              not properly segregated. It will notify the barangay and MENRO,
              and it will not be added to collected waste records.
            </p>
          </div>
        )}

        {status === "Missed" && (
          <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl text-sm flex items-start gap-2">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />

            <p>
              This will mark the request as missed. Use this only if the
              collection was not completed due to schedule, route, or operational
              issues.
            </p>
          </div>
        )}

        <button
          onClick={handleUpdate}
          disabled={
            !requestId ||
            status === "Collected" ||
            selectedRequest?.needsReschedule
          }
          className="w-full bg-green-700 text-white px-5 py-3 rounded-2xl shadow hover:bg-green-800 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PackageCheck size={18} />
          {status === "Collected"
            ? "Use Waste Recording Instead"
            : selectedRequest?.needsReschedule
            ? "Waiting for MENRO Reschedule"
            : "Update Status"}
        </button>
      </div>
    </div>
  );
}

function RequestInfo({ icon, label, value }) {
  return (
    <div className="bg-white border rounded-2xl p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900 mt-1 break-words">
          {value}
        </p>
      </div>
    </div>
  );
}