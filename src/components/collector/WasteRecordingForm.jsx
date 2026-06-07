import { useState } from "react";
import {
  Camera,
  Send,
  ClipboardList,
  FilePlus2,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import FormInput from "./FormInput";
import { allSibalomBarangays } from "../../data/collectionSchedule";

const WASTE_TYPE_OPTIONS = [
  "Recyclable",
  "Plastic",
  "Metal",
  "Glass",
  "Biodegradable",
  "Residual",
  "Mixed Waste",
];

const COLLECTION_POINT_OPTIONS = [
  "Barangay Hall",
  "Materials Recovery Facility (MRF)",
  "Designated Drop-off Area",
  "Temporary Collection Site",
];

export default function WasteRecordingForm({ requests, onSuccess }) {
  const [recordMode, setRecordMode] = useState("request");

  const [form, setForm] = useState({
    request_id: "",
    manual_barangay: "",
    manual_collection_point: "",
    collected_date: "",
    remarks: "",
  });

  const [wasteEntries, setWasteEntries] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const selectedRequest = requests.find(
    (r) => String(r.id) === String(form.request_id)
  );

  const editableRequests = requests.filter(
    (request) => request.status !== "Collected" && !request.needsReschedule
  );

  const barangayOptions = allSibalomBarangays;

  const totalActualWeight = wasteEntries.reduce(
    (sum, entry) => sum + parseKg(entry.weight),
    0
  );

  const vehicleUsed =
    recordMode === "request" && selectedRequest?.assignedTruck
      ? `${selectedRequest.assignedTruck.name} - ${
          selectedRequest.assignedTruck.shortLabel || "Assigned Truck"
        }`
      : "LGU Garbage Truck";

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleModeChange(mode) {
    setRecordMode(mode);
    setMessage("");
    setMessageType("");

    setForm({
      request_id: "",
      manual_barangay: "",
      manual_collection_point: "",
      collected_date: "",
      remarks: "",
    });

    setWasteEntries([]);
    setPhotoFile(null);
    setPreview("");
  }

  function handleRequestChange(requestId) {
    const request = requests.find(
      (item) => String(item.id) === String(requestId)
    );

    if (!request) {
      setForm((prev) => ({
        ...prev,
        request_id: "",
      }));

      setWasteEntries([]);
      return;
    }

    if (request.needsReschedule) {
      setMessage(
        "This request needs rescheduling and cannot be recorded until MENRO assigns a new schedule or available truck."
      );
      setMessageType("error");
      return;
    }

    const selectedTypes = splitWasteTypes(request.waste_type);

    const initialEntries =
      selectedTypes.length > 0
        ? selectedTypes.map((type) => ({
            type,
            weight: "",
          }))
        : [];

    setForm((prev) => ({
      ...prev,
      request_id: requestId,
    }));

    setWasteEntries(initialEntries);
  }

  function handleWasteTypeToggle(type) {
    setWasteEntries((prev) => {
      const exists = prev.some((entry) => entry.type === type);

      if (exists) {
        return prev.filter((entry) => entry.type !== type);
      }

      return [
        ...prev,
        {
          type,
          weight: "",
        },
      ];
    });
  }

  function updateWasteEntryWeight(type, value) {
    setWasteEntries((prev) =>
      prev.map((entry) =>
        entry.type === type
          ? {
              ...entry,
              weight: value,
            }
          : entry
      )
    );
  }

  function handleSelectPhoto(e) {
    const file = e.target.files?.[0];

    if (file) {
      setPhotoFile(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  async function uploadCompletionPhoto() {
    if (!photoFile) return null;

    const fileExt = photoFile.name.split(".").pop();

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;

    const filePath = `completion-proofs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("request-photos")
      .upload(filePath, photoFile);

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage
      .from("request-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function getRecorderProfileId() {
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData?.session?.user?.email;

    if (!email) return null;

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", String(email).toLowerCase())
      .maybeSingle();

    if (error || !profileData?.id) {
      console.error("Recorder profile lookup error:", error);
      return null;
    }

    return profileData.id;
  }

  async function getBarangayProfileId(barangay) {
    if (!barangay) return null;

    const normalizedBarangay = normalizeBarangayName(barangay);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, barangay, role, status")
      .ilike("role", "%barangay%");

    if (error) {
      console.error("Barangay profile lookup error:", error);
      return null;
    }

    const matchedProfile = (data || []).find(
      (profile) =>
        normalizeBarangayName(profile.barangay) === normalizedBarangay &&
        String(profile.status || "").toLowerCase() !== "inactive"
    );

    return matchedProfile?.id || null;
  }

  function validateWasteEntries() {
    if (wasteEntries.length === 0) {
      setMessage("Please select at least one waste type.");
      setMessageType("error");
      return null;
    }

    const validWasteEntries = wasteEntries
      .map((entry) => ({
        type: entry.type,
        weight: parseKg(entry.weight),
      }))
      .filter((entry) => entry.type && entry.weight > 0);

    if (validWasteEntries.length === 0) {
      setMessage("Please enter actual kg for at least one waste type.");
      setMessageType("error");
      return null;
    }

    const hasMissingWeight = wasteEntries.some(
      (entry) => entry.type && parseKg(entry.weight) <= 0
    );

    if (hasMissingWeight) {
      setMessage("Please enter kg for every selected waste type.");
      setMessageType("error");
      return null;
    }

    return validWasteEntries;
  }

  async function handleSaveRecord() {
    setMessage("");
    setMessageType("");

    if (recordMode === "request" && !selectedRequest) {
      setMessage("Please select a pickup request.");
      setMessageType("error");
      return;
    }

    if (recordMode === "request" && selectedRequest.needsReschedule) {
      setMessage(
        "This request needs rescheduling and cannot be recorded until MENRO assigns a new schedule or available truck."
      );
      setMessageType("error");
      return;
    }

    if (recordMode === "request" && selectedRequest.status === "Collected") {
      setMessage(
        "This request is already collected and can no longer be recorded again."
      );
      setMessageType("error");
      return;
    }

    if (recordMode === "manual" && !form.manual_barangay) {
      setMessage("Please select a barangay for the manual collection record.");
      setMessageType("error");
      return;
    }

    if (recordMode === "manual" && !form.manual_collection_point) {
      setMessage("Please select a collection point for the manual record.");
      setMessageType("error");
      return;
    }

    const validWasteEntries = validateWasteEntries();
    if (!validWasteEntries) return;

    setSaving(true);

    try {
      const photoUrl = await uploadCompletionPhoto();
      const recorderProfileId = await getRecorderProfileId();

      const collectedDate =
        form.collected_date || new Date().toISOString().slice(0, 10);

      if (recordMode === "request") {
        const requestId = String(selectedRequest.id);

        const { data: existingRecords, error: checkError } = await supabase
          .from("waste_records")
          .select("id")
          .eq("request_id", requestId)
          .limit(1);

        if (checkError) {
          throw new Error(checkError.message);
        }

        if (existingRecords && existingRecords.length > 0) {
          setMessage("This pickup request already has a waste record.");
          setMessageType("error");
          setSaving(false);
          return;
        }

        const recordsToInsert = validWasteEntries.map((entry) => ({
          request_id: requestId,
          route_name: selectedRequest.barangay,
          collection_point: selectedRequest.collection_point,
          waste_type: entry.type,
          actual_weight: entry.weight,
          collected_date: collectedDate,
          vehicle: vehicleUsed,
          remarks: form.remarks,
          photo_url: photoUrl,
          recorded_by: recorderProfileId,
        }));

        const { error: recordError } = await supabase
          .from("waste_records")
          .insert(recordsToInsert);

        if (recordError) throw new Error(recordError.message);

        const { error: updateError } = await supabase
          .from("collection_requests")
          .update({ status: "Collected" })
          .eq("id", selectedRequest.id);

        if (updateError) throw new Error(updateError.message);

        const notificationRows = [];

        if (selectedRequest.submitted_by) {
          notificationRows.push({
            user_id: selectedRequest.submitted_by,
            title: "Waste Successfully Collected",
            message: `${
              selectedRequest?.barangay || "Barangay"
            } waste request has been collected by MENRO.`,
            type: "collection_complete",
            is_read: false,
          });
        }

        notificationRows.push({
          role: "lgu_admin",
          title: "Collection Completed",
          message: `${
            selectedRequest?.barangay || "Barangay"
          } request has been completed by collection staff using ${vehicleUsed}.`,
          type: "collection_complete",
          is_read: false,
        });

        await supabase.from("notifications").insert(notificationRows);

        setMessage("Waste record saved and request marked as collected.");
        setMessageType("success");
      }

      if (recordMode === "manual") {
        const manualWasteTypes = validWasteEntries
          .map((entry) => entry.type)
          .join(", ");

        const barangayProfileId = await getBarangayProfileId(
          form.manual_barangay
        );

        const manualCollectionPoint = form.manual_collection_point;

        const manualRemarks =
          form.remarks ||
          "Manual collection record encoded by collection staff because no online barangay request was submitted.";

        const { data: manualRequest, error: requestError } = await supabase
          .from("collection_requests")
          .insert([
            {
              barangay: form.manual_barangay,
              request_title: "Manual Collection Record",
              waste_type: manualWasteTypes,
              estimated_weight: totalActualWeight,
              collection_point: manualCollectionPoint,
              status: "Collected",
              submitted_by: barangayProfileId,
              remarks: manualRemarks,
            },
          ])
          .select()
          .single();

        if (requestError) throw new Error(requestError.message);

        const recordsToInsert = validWasteEntries.map((entry) => ({
          request_id: String(manualRequest.id),
          route_name: form.manual_barangay,
          collection_point: manualCollectionPoint,
          waste_type: entry.type,
          actual_weight: entry.weight,
          collected_date: collectedDate,
          vehicle: "LGU Garbage Truck",
          remarks: manualRemarks,
          photo_url: photoUrl,
          recorded_by: recorderProfileId,
        }));

        const { error: recordError } = await supabase
          .from("waste_records")
          .insert(recordsToInsert);

        if (recordError) throw new Error(recordError.message);

        const notificationRows = [
          {
            role: "lgu_admin",
            title: "Manual Collection Record Added",
            message: `${form.manual_barangay} manual collection record was encoded by collection staff and marked as collected.`,
            type: "manual_collection_record",
            is_read: false,
          },
        ];

        if (barangayProfileId) {
          notificationRows.push({
            user_id: barangayProfileId,
            title: "Collection Record Added",
            message: `A manual collection record for ${form.manual_barangay} was encoded by collection staff and marked as collected.`,
            type: "manual_collection_record",
            is_read: false,
          });
        }

        await supabase.from("notifications").insert(notificationRows);

        setMessage(
          "Manual collection request and waste record saved successfully."
        );
        setMessageType("success");
      }

      setForm({
        request_id: "",
        manual_barangay: "",
        manual_collection_point: "",
        collected_date: "",
        remarks: "",
      });

      setWasteEntries([]);
      setPhotoFile(null);
      setPreview("");

      setTimeout(() => onSuccess(), 700);
    } catch (err) {
      setMessage(err.message || "Failed to save waste record.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold">Collection Recording</h3>
        <p className="text-sm text-gray-500">
          Record actual collected waste from scheduled requests or manual field
          collection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => handleModeChange("request")}
          className={`rounded-2xl border p-4 text-left transition ${
            recordMode === "request"
              ? "bg-green-50 border-green-300 text-green-800"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <ClipboardList size={22} />

            <div>
              <p className="font-bold">From Scheduled Request</p>
              <p className="text-xs mt-1">
                Use this if MENRO scheduled a barangay request.
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("manual")}
          className={`rounded-2xl border p-4 text-left transition ${
            recordMode === "manual"
              ? "bg-green-50 border-green-300 text-green-800"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <FilePlus2 size={22} />

            <div>
              <p className="font-bold">Manual Collection Record</p>
              <p className="text-xs mt-1">
                Use this if no online request was submitted by the barangay.
              </p>
            </div>
          </div>
        </button>
      </div>

      {recordMode === "request" && requests.some((r) => r.needsReschedule) && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <p>
            Some requests need rescheduling and are hidden from the pickup
            request list. They must be rescheduled by LGU/MENRO before the
            collector can record them.
          </p>
        </div>
      )}

      {recordMode === "request" && selectedRequest && (
        <div className="mb-6 bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-sm text-green-700 font-semibold">
            Selected Route Assignment
          </p>

          <h4 className="font-bold text-green-900 mt-1">
            {selectedRequest.schedule_group || "No route group"}
          </h4>

          <p className="text-sm text-gray-600 mt-1">
            {selectedRequest.allowed_waste_category ||
              "No allowed waste category"}{" "}
            • {selectedRequest.route_schedule || "No route schedule"}
          </p>

          {selectedRequest.assignedTruck && (
            <div className="mt-4 rounded-2xl border bg-white p-4 flex items-start gap-3">
              <div
                className="h-11 w-11 rounded-2xl text-white flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: selectedRequest.assignedTruck.color || "#15803d",
                }}
              >
                <Truck size={20} />
              </div>

              <div>
                <p className="text-xs text-gray-500">Assigned Truck</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {selectedRequest.assignedTruck.name} -{" "}
                  {selectedRequest.assignedTruck.label ||
                    selectedRequest.assignedTruck.shortLabel}
                </p>

                <p className="text-xs text-gray-600 mt-1">
                  Vehicle Used:{" "}
                  <span className="font-semibold">{vehicleUsed}</span>
                </p>

                {selectedRequest.isReassignedToBackup && (
                  <p className="text-xs font-semibold text-red-600 mt-2">
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <MiniInfo
              label="Barangay"
              value={selectedRequest.barangay || "Unspecified"}
            />

            <MiniInfo
              label="Submitted Waste Type"
              value={selectedRequest.waste_type || "Unspecified"}
            />

            <MiniInfo
              label="Estimated Weight"
              value={`${formatKg(
                selectedRequest.actual_weight ||
                  selectedRequest.estimated_weight ||
                  selectedRequest.weight ||
                  selectedRequest.quantity ||
                  0
              )} kg`}
            />
          </div>
        </div>
      )}

      {message && (
        <div
          className={`mb-5 px-4 py-3 rounded-2xl text-sm ${
            messageType === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recordMode === "request" && (
          <div>
            <label className="text-sm font-medium text-gray-600">
              Pickup Request
            </label>

            <select
              className="input-field"
              value={form.request_id}
              onChange={(e) => handleRequestChange(e.target.value)}
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
        )}

        {recordMode === "manual" && (
          <div>
            <label className="text-sm font-medium text-gray-600">
              Barangay / Route
            </label>

            <select
              className="input-field"
              value={form.manual_barangay}
              onChange={(e) => updateField("manual_barangay", e.target.value)}
            >
              <option value="">Select barangay</option>

              {barangayOptions.map((barangay) => (
                <option key={barangay} value={barangay}>
                  {barangay}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-600">
            Total Actual Weight
          </label>

          <input
            type="text"
            value={`${formatKg(totalActualWeight)} kg`}
            readOnly
            className="input-field bg-gray-50 font-semibold text-green-700"
            placeholder="Auto-computed from waste type kg"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-600">
            Waste Type and Actual KG
          </label>

          <div className="mt-2 border rounded-2xl p-4 bg-gray-50">
            {recordMode === "request" ? (
              <p className="text-xs text-gray-500 mb-3">
                Auto-filled from the selected barangay request. Enter the actual
                collected kg for each selected waste type.
              </p>
            ) : (
              <p className="text-xs text-gray-500 mb-3">
                Manual record: select the waste type/s collected and enter
                actual kg per type.
              </p>
            )}

            <div className="grid grid-cols-1 gap-3">
              {WASTE_TYPE_OPTIONS.map((type) => {
                const entry = wasteEntries.find((item) => item.type === type);
                const checked = Boolean(entry);

                return (
                  <div
                    key={type}
                    className={`grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3 items-center rounded-2xl border px-4 py-3 transition ${
                      checked
                        ? "bg-green-50 border-green-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleWasteTypeToggle(type)}
                        className="w-4 h-4 accent-green-700"
                      />

                      <span
                        className={`text-sm font-semibold ${
                          checked ? "text-green-800" : "text-gray-700"
                        }`}
                      >
                        {type}
                      </span>
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      disabled={!checked}
                      value={entry?.weight || ""}
                      onChange={(e) =>
                        updateWasteEntryWeight(type, e.target.value)
                      }
                      placeholder="kg"
                      className="border rounded-xl px-4 py-2 outline-none focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-4 bg-white border rounded-2xl p-3">
              <p className="text-xs text-gray-500">Total Collected Weight</p>
              <p className="text-lg font-bold text-green-700">
                {formatKg(totalActualWeight)} kg
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">
            Date Collected
          </label>

          <input
            type="date"
            value={form.collected_date}
            onChange={(e) => updateField("collected_date", e.target.value)}
            className="input-field"
          />
        </div>

        <FormInput
          label="Vehicle Used"
          placeholder="LGU Garbage Truck"
          value={vehicleUsed}
          readOnly
          onChange={() => {}}
        />

        {recordMode === "request" && (
          <div>
            <label className="text-sm font-medium text-gray-600">
              Collection Point
            </label>

            <input
              type="text"
              value={selectedRequest?.collection_point || ""}
              readOnly
              className="input-field bg-gray-50"
              placeholder="Auto-filled after selecting request"
            />
          </div>
        )}

        {recordMode === "manual" && (
          <div>
            <label className="text-sm font-medium text-gray-600">
              Collection Point
            </label>

            <select
              className="input-field"
              value={form.manual_collection_point}
              onChange={(e) =>
                updateField("manual_collection_point", e.target.value)
              }
            >
              <option value="">Select collection point</option>

              {COLLECTION_POINT_OPTIONS.map((point) => (
                <option key={point} value={point}>
                  {point}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-600">
            Collection Remarks
          </label>

          <textarea
            rows="4"
            placeholder="Add remarks about collected waste condition or pickup completion..."
            value={form.remarks}
            onChange={(e) => updateField("remarks", e.target.value)}
            className="input-field resize-none"
          ></textarea>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-600">
            Completion Photo
          </label>

          <div className="mt-2 border-2 border-dashed border-green-300 bg-green-50 rounded-3xl p-8 text-center">
            <Camera className="mx-auto text-green-700 mb-3" size={36} />

            <p className="font-semibold text-green-800">
              Upload collection completion photo
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Proof that the waste was collected from the collection point.
            </p>

            <input
              type="file"
              accept="image/*"
              id="completion-photo"
              className="hidden"
              onChange={handleSelectPhoto}
            />

            <label
              htmlFor="completion-photo"
              className="mt-4 inline-block bg-white border px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 cursor-pointer"
            >
              Choose File
            </label>

            {preview && (
              <div className="mt-5 flex justify-center">
                <img
                  src={preview}
                  alt="Completion preview"
                  className="w-48 h-36 object-cover rounded-2xl border"
                />
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="button"
            disabled={saving || (recordMode === "request" && selectedRequest?.needsReschedule)}
            onClick={handleSaveRecord}
            className="bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-2xl shadow hover:bg-green-800 flex items-center gap-2"
          >
            <Send size={18} />
            {saving
              ? "Saving..."
              : recordMode === "manual"
              ? "Save Manual Record"
              : "Save Waste Record"}
          </button>
        </div>
      </form>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="bg-white border rounded-2xl p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function splitWasteTypes(value) {
  if (!value) return [];

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

function normalizeBarangayName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^barangay\s+/i, "")
    .replace(/^brgy\.?\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}