import { useState } from "react";
import { CalendarDays, AlertTriangle, Save, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

const SCHEDULE_GROUP_OPTIONS = [
  "1st Tuesday",
  "1st Thursday",
  "2nd Tuesday",
  "2nd Thursday",
  "3rd Tuesday",
  "3rd Thursday",
  "4th Tuesday",
  "4th Thursday",
  "Special Collection",
];

export default function RescheduleRouteModal({
  request,
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState({
    schedule_group: request?.schedule_group || "",
    preferred_pickup_date: request?.preferred_pickup_date || "",
    remarks:
      request?.rescheduleReason ||
      "Truck is unavailable, so this request needs to be rescheduled.",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  if (!request) return null;

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setMessage("");
    setMessageType("");
  }

  async function handleSave() {
    setMessage("");
    setMessageType("");

    if (!form.schedule_group) {
      setMessage("Please select a new schedule group.");
      setMessageType("error");
      return;
    }

    if (!form.preferred_pickup_date) {
      setMessage("Please select a new pickup date.");
      setMessageType("error");
      return;
    }

    setSaving(true);

    const newRemarks = buildRemarks(request, form.remarks);

    const { error } = await supabase
      .from("collection_requests")
      .update({
        status: "Scheduled",
        schedule_group: form.schedule_group,
        preferred_pickup_date: form.preferred_pickup_date,
        remarks: newRemarks,
      })
      .eq("id", request.id);

    if (error) {
      console.error("Reschedule route error:", error);
      setMessage(error.message || "Failed to reschedule route.");
      setMessageType("error");
      setSaving(false);
      return;
    }

    await createRescheduleNotifications(request, form);

    setMessage(
      "Route rescheduled successfully. Barangay and collectors will receive notification updates."
    );
    setMessageType("success");

    setTimeout(() => {
      onSuccess?.();
      onClose?.();
    }, 900);

    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6">
      <div className="min-h-full flex items-start sm:items-center justify-center">
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="bg-green-700 text-white px-4 sm:px-6 py-4 sm:py-5 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold">
                  Reschedule Route
                </h3>
                <p className="text-xs sm:text-sm text-white/90 mt-1">
                  Set a new collection schedule for the affected request.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center disabled:opacity-60 shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
            {message && (
              <div
                className={`rounded-2xl px-4 py-3 text-sm ${
                  messageType === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={20}
                  className="text-red-600 shrink-0 mt-0.5"
                />

                <div>
                  <p className="text-sm font-bold text-red-700">
                    This route needs rescheduling
                  </p>

                  <p className="text-xs text-red-600 mt-1 leading-relaxed">
                    {request.rescheduleReason ||
                      "The assigned truck is unavailable and this request needs MENRO action."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoBox
                label="Request ID"
                value={`CR-${String(request.id).padStart(3, "0")}`}
              />

              <InfoBox
                label="Barangay"
                value={request.barangay || "Unspecified"}
              />

              <InfoBox
                label="Waste Type"
                value={request.waste_type || request.waste || "Unspecified"}
              />

              <InfoBox
                label="Original Truck"
                value={request.originalAssignedTruck?.name || "Truck 1"}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  New Schedule Group
                </label>

                <select
                  value={form.schedule_group}
                  onChange={(e) =>
                    updateField("schedule_group", e.target.value)
                  }
                  className="mt-2 w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                >
                  <option value="">Select new schedule</option>

                  {SCHEDULE_GROUP_OPTIONS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  New Pickup Date
                </label>

                <input
                  type="date"
                  value={form.preferred_pickup_date}
                  onChange={(e) =>
                    updateField("preferred_pickup_date", e.target.value)
                  }
                  className="mt-2 w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">
                Reschedule Remarks
              </label>

              <textarea
                rows="4"
                value={form.remarks}
                onChange={(e) => updateField("remarks", e.target.value)}
                placeholder="Explain why this route was rescheduled..."
                className="mt-2 w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none resize-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
              />
            </div>

            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <CalendarDays
                  size={20}
                  className="text-green-700 shrink-0 mt-0.5"
                />

                <div>
                  <p className="text-sm font-bold text-gray-800">
                    What happens after rescheduling?
                  </p>

                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    The request will return to <strong>Scheduled</strong> status
                    with the new route and pickup date. Barangay users will see
                    the updated schedule, and collection staff will only see it
                    if it matches their truck and route assignment.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
              <p className="text-sm font-bold text-green-800">
                Feedback message to barangay
              </p>

              <p className="text-xs sm:text-sm text-green-700 mt-2 leading-relaxed">
                Your collection request{" "}
                <strong>CR-{String(request.id).padStart(3, "0")}</strong> will
                be marked as rescheduled by MENRO. The barangay will see the
                updated schedule and pickup date in their tracking page.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-4 sm:px-6 py-4 bg-white shrink-0">
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="w-full sm:w-auto rounded-2xl border px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto rounded-2xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save Reschedule"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl border bg-gray-50 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-900 mt-1 break-words">
        {value}
      </p>
    </div>
  );
}

function buildRemarks(request, remarks) {
  const oldRemarks = request?.remarks ? String(request.remarks).trim() : "";
  const newRemarks = remarks ? String(remarks).trim() : "";

  const rescheduleNote = `[Rescheduled by MENRO] ${
    newRemarks || "Route rescheduled due to truck unavailability."
  }`;

  if (!oldRemarks) return rescheduleNote;

  return `${oldRemarks}\n\n${rescheduleNote}`;
}

async function createRescheduleNotifications(request, form) {
  const notificationRows = [];

  const requestCode = `CR-${String(request?.id).padStart(3, "0")}`;
  const formattedDate = formatDateForMessage(form.preferred_pickup_date);

  if (request?.submitted_by) {
    notificationRows.push({
      user_id: request.submitted_by,
      title: "Collection Request Rescheduled",
      message: `Your collection request ${requestCode} has been rescheduled by MENRO. New schedule: ${form.schedule_group} on ${formattedDate}. Please check your updated tracking page.`,
      type: "route_rescheduled",
      is_read: false,
    });
  }

  notificationRows.push({
    role: "collector",
    title: "Route Rescheduled by MENRO",
    message: `Collection request ${requestCode} for ${
      request?.barangay || "a barangay"
    } was rescheduled to ${form.schedule_group} on ${formattedDate}. Please check your assigned pickup list.`,
    type: "route_rescheduled",
    is_read: false,
  });

  notificationRows.push({
    role: "lgu_admin",
    title: "Route Rescheduled",
    message: `Collection request ${requestCode} was successfully rescheduled to ${form.schedule_group} on ${formattedDate}.`,
    type: "route_rescheduled",
    is_read: false,
  });

  if (notificationRows.length > 0) {
    const { error } = await supabase
      .from("notifications")
      .insert(notificationRows);

    if (error) {
      console.error("Reschedule notification error:", error);
    }
  }
}

function formatDateForMessage(value) {
  if (!value) return "the selected date";

  return new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}