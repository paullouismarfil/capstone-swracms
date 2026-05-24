import { useState } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import FormInput from "./FormInput";
import SelectField from "./SelectField";

export default function SubmitRequestForm({ profile, schedule, onSuccess }) {
  const [form, setForm] = useState({
    request_title: "",
    waste_type: "Recyclable",
    collection_point: "Barangay Hall",
    preferred_pickup_date: "",
    estimated_weight: "",
    sacks_count: "",
    remarks: "",
  });

  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSelectPhotos(e) {
    const selected = Array.from(e.target.files || []);
    const combined = [...photoFiles, ...selected].slice(0, 10);

    setPhotoFiles(combined);

    const previews = combined.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setPhotoPreviews(previews);
  }

  function removePhoto(index) {
    const updatedFiles = photoFiles.filter((_, i) => i !== index);
    setPhotoFiles(updatedFiles);

    const updatedPreviews = updatedFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setPhotoPreviews(updatedPreviews);
  }

  async function uploadPhotos() {
    const uploadedUrls = [];

    for (const file of photoFiles) {
      const fileExt = file.name.split(".").pop();

      const safeBarangay = String(profile?.barangay || "unknown-barangay")
        .replaceAll(" ", "-")
        .toLowerCase();

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const filePath = `${safeBarangay}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("request-photos")
        .upload(filePath, file);

      if (uploadError) throw new Error(uploadError.message);

      const { data: publicUrlData } = supabase.storage
        .from("request-photos")
        .getPublicUrl(filePath);

      uploadedUrls.push(publicUrlData.publicUrl);
    }

    return uploadedUrls;
  }

  async function handleSubmit() {
    setMessage("");
    setMessageType("");

    if (!profile) {
      setMessage("User profile is still loading.");
      setMessageType("error");
      return;
    }

    if (!profile.barangay) {
      setMessage("No assigned barangay found for this account.");
      setMessageType("error");
      return;
    }

    if (!form.request_title.trim() || !form.estimated_weight.trim()) {
      setMessage("Please complete the request title and estimated weight.");
      setMessageType("error");
      return;
    }

    setSaving(true);

    try {
      const uploadedUrls = await uploadPhotos();

      const requestPayload = {
        request_title: form.request_title.trim(),
        barangay: profile.barangay,
        collection_point: form.collection_point,
        waste_type: form.waste_type,
        estimated_weight: form.estimated_weight.trim(),
        sacks_count: form.sacks_count.trim(),
        preferred_pickup_date: form.preferred_pickup_date || null,
        remarks: form.remarks.trim(),
        status: "Pending",
        image_url: uploadedUrls[0] || null,
        image_urls: uploadedUrls,
        schedule_group: schedule?.group || null,
        route_schedule: schedule?.assignedDropOffSchedule || schedule?.group || null,
        allowed_waste_category: schedule?.wasteCategory || null,
        submitted_by: profile.id,
      };

      const { error } = await supabase
        .from("collection_requests")
        .insert([requestPayload]);

      if (error) {
        setMessage(error.message);
        setMessageType("error");
        return;
      }

      const { error: notifError } = await supabase.from("notifications").insert([
        {
          role: "lgu_admin",
          title: "New Collection Request",
          message: `${profile.barangay} submitted a new waste collection request.`,
          type: "request",
          is_read: false,
        },
      ]);

      if (notifError) {
        setMessage(
          `Request submitted, but notification failed: ${notifError.message}`
        );
        setMessageType("error");
        return;
      }

      setMessage("Collection request submitted successfully.");
      setMessageType("success");

      setForm({
        request_title: "",
        waste_type: "Recyclable",
        collection_point: "Barangay Hall",
        preferred_pickup_date: "",
        estimated_weight: "",
        sacks_count: "",
        remarks: "",
      });

      setPhotoFiles([]);
      setPhotoPreviews([]);

      setTimeout(() => {
        onSuccess();
      }, 700);
    } catch (err) {
      setMessage(err.message || "Photo upload failed.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold">Submit Collection Request</h3>
        <p className="text-sm text-gray-500">
          Barangay personnel may request MENRO pickup once waste has been
          gathered at the barangay collection point.
        </p>
      </div>

      {schedule && (
        <div className="mb-6 bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-sm text-green-700 font-semibold">
            Auto Route Assignment
          </p>

          <h4 className="text-lg font-bold text-green-900 mt-1">
            {schedule.group}
          </h4>

          <p className="text-sm text-gray-600 mt-1">{schedule.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div className="bg-white rounded-xl p-3 border">
              <p className="text-xs text-gray-500">Collection Time</p>
              <p className="font-semibold text-sm">{schedule.time}</p>
            </div>

            <div className="bg-white rounded-xl p-3 border">
              <p className="text-xs text-gray-500">Allowed Waste</p>
              <p className="font-semibold text-sm">{schedule.wasteCategory}</p>
            </div>

            <div className="bg-white rounded-xl p-3 border">
              <p className="text-xs text-gray-500">Route Schedule</p>
              <p className="font-semibold text-sm">
                {schedule.assignedDropOffSchedule || schedule.group}
              </p>
            </div>
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
        <FormInput
          label="Request Title"
          placeholder="e.g. Barangay waste pickup request"
          value={form.request_title}
          onChange={(value) => updateField("request_title", value)}
        />

        <SelectField
          label="Waste Type"
          value={form.waste_type}
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

        <SelectField
          label="Collection Point"
          value={form.collection_point}
          onChange={(value) => updateField("collection_point", value)}
          options={[
            "Barangay Hall",
            "Materials Recovery Facility (MRF)",
            "Designated Drop-off Area",
            "Temporary Collection Site",
          ]}
        />

        <div>
          <label className="text-sm font-medium text-gray-600">
            Preferred Pickup Date
          </label>

          <input
            type="date"
            value={form.preferred_pickup_date}
            onChange={(e) =>
              updateField("preferred_pickup_date", e.target.value)
            }
            className="input-field"
          />
        </div>

        <FormInput
          label="Estimated Weight"
          placeholder="e.g. 20"
          value={form.estimated_weight}
          onChange={(value) => updateField("estimated_weight", value)}
        />

        <FormInput
          label="Number of Sacks / Containers"
          placeholder="e.g. 10 sacks"
          value={form.sacks_count}
          onChange={(value) => updateField("sacks_count", value)}
        />

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-600">Remarks</label>

          <textarea
            rows="4"
            placeholder="Add remarks such as estimated sacks, waste condition, or pickup instructions..."
            value={form.remarks}
            onChange={(e) => updateField("remarks", e.target.value)}
            className="input-field resize-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-600">
            Collection Point Photo Evidence
          </label>

          <div className="mt-2 border-2 border-dashed border-green-300 bg-green-50 rounded-3xl p-8 text-center">
            <ImagePlus className="mx-auto text-green-700 mb-3" size={36} />

            <p className="font-semibold text-green-800">
              Upload collection point photo evidence
            </p>

            <p className="text-sm text-gray-500 mt-1">
              You may upload up to 10 photos.
            </p>

            <input
              type="file"
              accept="image/*"
              multiple
              id="request-photos"
              className="hidden"
              onChange={handleSelectPhotos}
            />

            <label
              htmlFor="request-photos"
              className="mt-4 inline-block bg-white border px-5 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 cursor-pointer"
            >
              Choose Photos
            </label>

            {photoPreviews.length > 0 && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {photoPreviews.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full h-28 object-cover rounded-2xl border"
                    />

                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center shadow"
                    >
                      <X size={14} />
                    </button>

                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {photo.name}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {photoFiles.length >= 10 && (
              <p className="text-sm text-orange-600 mt-3">
                Maximum of 10 photos only.
              </p>
            )}
          </div>
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={handleSubmit}
            className="bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-2xl shadow hover:bg-green-800 flex items-center gap-2"
          >
            <Send size={18} />
            {saving ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}