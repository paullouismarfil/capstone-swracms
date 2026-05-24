import { useState } from "react";
import { Camera, Send } from "lucide-react";
import { supabase } from "../../lib/supabase";
import FormInput from "./FormInput";
import SelectField from "./SelectField";

export default function WasteRecordingForm({ requests, onSuccess }) {
  const [form, setForm] = useState({
    request_id: "",
    actual_weight: "",
    waste_type: "",
    collected_date: "",
    remarks: "",
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const selectedRequest = requests.find(
    (r) => String(r.id) === String(form.request_id)
  );

  const editableRequests = requests.filter(
    (request) => request.status !== "Collected"
  );

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
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

  async function handleSaveRecord() {
    setMessage("");
    setMessageType("");

    if (!selectedRequest) {
      setMessage("Please select a pickup request.");
      setMessageType("error");
      return;
    }

    if (selectedRequest.status === "Collected") {
      setMessage(
        "This request is already collected and can no longer be recorded again."
      );
      setMessageType("error");
      return;
    }

    if (!form.actual_weight) {
      setMessage("Please enter the actual weight collected.");
      setMessageType("error");
      return;
    }

    setSaving(true);

    try {
      const requestId = String(selectedRequest.id);

      const { data: existingRecord, error: checkError } = await supabase
        .from("waste_records")
        .select("id")
        .eq("request_id", requestId)
        .maybeSingle();

      if (checkError) {
        throw new Error(checkError.message);
      }

      if (existingRecord) {
        setMessage("This pickup request already has a waste record.");
        setMessageType("error");
        setSaving(false);
        return;
      }

      const photoUrl = await uploadCompletionPhoto();

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || null;

      const finalWasteType =
        form.waste_type || selectedRequest.waste_type || "Recyclable";

      const { error: recordError } = await supabase
        .from("waste_records")
        .insert([
          {
            request_id: requestId,
            route_name: selectedRequest.barangay,
            collection_point: selectedRequest.collection_point,
            waste_type: finalWasteType,
            actual_weight: form.actual_weight,
            collected_date:
              form.collected_date || new Date().toISOString().slice(0, 10),
            vehicle: "LGU Garbage Truck",
            remarks: form.remarks,
            photo_url: photoUrl,
            recorded_by: userId,
          },
        ]);

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
        } request has been completed by collection staff.`,
        type: "collection_complete",
        is_read: false,
      });

      await supabase.from("notifications").insert(notificationRows);

      setMessage("Waste record saved and request marked as collected.");
      setMessageType("success");

      setForm({
        request_id: "",
        actual_weight: "",
        waste_type: "",
        collected_date: "",
        remarks: "",
      });

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
        <h3 className="text-xl font-bold">Record Actual Collected Waste</h3>
        <p className="text-sm text-gray-500">
          Encode actual waste after MENRO truck pickup completion.
        </p>
      </div>

      {selectedRequest && (
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
        <div>
          <label className="text-sm font-medium text-gray-600">
            Pickup Request
          </label>

          <select
            className="input-field"
            value={form.request_id}
            onChange={(e) => updateField("request_id", e.target.value)}
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

        <FormInput
          label="Actual Weight Collected"
          placeholder="e.g. 20"
          value={form.actual_weight}
          onChange={(value) => updateField("actual_weight", value)}
        />

        <SelectField
          label="Waste Type"
          value={form.waste_type || selectedRequest?.waste_type || "Recyclable"}
          onChange={(value) => updateField("waste_type", value)}
          options={[
            "Recyclable",
            "Plastic",
            "Metal",
            "Glass",
            "Biodegradable",
            "Residual",
            "Mixed Waste",
          ]}
        />

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
          value="LGU Garbage Truck"
          readOnly
          onChange={() => {}}
        />

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
            disabled={saving || !selectedRequest}
            onClick={handleSaveRecord}
            className="bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-2xl shadow hover:bg-green-800 flex items-center gap-2"
          >
            <Send size={18} />
            {saving ? "Saving..." : "Save Waste Record"}
          </button>
        </div>
      </form>
    </div>
  );
}