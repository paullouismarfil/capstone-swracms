import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { findBarangaySchedule } from "../data/collectionSchedule";
import { searchCollectionRequests } from "../utils/searchHelpers";
import NotificationsPage from "../components/NotificationsPage";
import NotificationBell from "../components/NotificationBell";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Clock,
  CheckCircle,
  Trophy,
  Bell,
  Search,
  Recycle,
  ImagePlus,
  Send,
  ClipboardList,
  X,
} from "lucide-react";

export default function BarangayPortal() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const barangaySchedule = findBarangaySchedule(profile?.barangay);
  const searchedRequests = searchCollectionRequests(requests, searchTerm);
  useEffect(() => {
    loadProfileAndRequests();
  }, []);

  async function loadProfileAndRequests() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      fetchRequests(profileData.barangay);
    }
  }

  async function fetchRequests(barangayName) {
    setLoadingRequests(true);

    const { data, error } = await supabase
      .from("collection_requests")
      .select("*")
      .eq("barangay", barangayName)
      .order("created_at", { ascending: false });

    if (!error) setRequests(data || []);
    setLoadingRequests(false);
  }

  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const scheduledCount = requests.filter((r) => r.status === "Scheduled").length;
  const collectedCount = requests.filter((r) => r.status === "Collected").length;


  return (
    <div className="min-h-screen bg-[#f4f7f3] flex text-gray-900">
      <aside className="hidden lg:flex w-72 bg-green-950 text-white flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-green-700 flex items-center justify-center">
            <Recycle size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">SWRaCMS</h1>
            <p className="text-xs text-green-200">Barangay User Portal</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeSection === "dashboard"} onClick={() => setActiveSection("dashboard")} />
          <SidebarItem icon={<FileText size={20} />} label="Submit Request" active={activeSection === "submit"} onClick={() => setActiveSection("submit")} />
          <SidebarItem icon={<ClipboardList size={20} />} label="Track Requests" active={activeSection === "track"} onClick={() => setActiveSection("track")} />
          <SidebarItem icon={<Bell size={20} />} label="Notifications" active={activeSection === "notifications"} onClick={() => setActiveSection("notifications")} />
          <SidebarItem icon={<CalendarDays size={20} />} label="Collection Schedule" active={activeSection === "schedule"} onClick={() => setActiveSection("schedule")} />
          <SidebarItem icon={<Trophy size={20} />} label="Leaderboard" active={activeSection === "leaderboard"} onClick={() => setActiveSection("leaderboard")} />
        </nav>

        <div className="bg-green-900 rounded-2xl p-4 mt-6">
          <p className="text-sm font-semibold">Barangay Account</p>
          <p className="text-xs text-green-200 mt-1">
            {profile?.barangay || "Loading barangay..."}
          </p>
        </div>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold">
              {getPageTitle(activeSection)}
            </h2>
            <p className="text-gray-500 mt-1">
              {getPageSubtitle(activeSection)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none text-sm bg-transparent w-40"
              />
            </div>

            <NotificationBell role="barangay" />

            <div className="bg-green-700 text-white px-4 py-3 rounded-2xl shadow">
              {profile?.barangay || "Barangay"}
            </div>
          </div>
        </header>

        {activeSection === "dashboard" && (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
              <StatCard title="Collection Requests" value={requests.length} note="Total submitted requests" icon={<FileText size={26} />} color="green" />
              <StatCard title="Pending Approval" value={pendingCount} note="Waiting for LGU validation" icon={<Clock size={26} />} color="orange" />
              <StatCard title="Scheduled Pickup" value={scheduledCount} note="Assigned for collection" icon={<CalendarDays size={26} />} color="blue" />
              <StatCard title="Collected Requests" value={collectedCount} note="Successfully collected" icon={<CheckCircle size={26} />} color="green" />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <BarangayScheduleCard schedule={barangaySchedule} barangay={profile?.barangay} />

              <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border p-6">
                <h3 className="text-xl font-bold">Collection Point Overview</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Summary of waste gathered at the barangay collection point.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <OverviewCard title="Collection Point" value="Barangay Hall" />
                  <OverviewCard title="Total Requests" value={requests.length} />
                  <OverviewCard title="Pending" value={pendingCount} />
                  <OverviewCard title="Status" value="Active" />
                </div>
              </div>

              <LeaderboardCard />
              <TrackRequestsTable requests={searchedRequests.slice(0, 2)} loading={loadingRequests} />
            </section>
          </>
        )}

        {activeSection === "submit" && (
          <SubmitRequestForm
            profile={profile}
            schedule={barangaySchedule}
            onSuccess={() => {
              fetchRequests(profile?.barangay);
              setActiveSection("track");
            }}
          />
        )}

        {activeSection === "track" && (
          <TrackRequestsTable requests={searchedRequests} loading={loadingRequests} full />
        )}

        {activeSection === "notifications" && (
          <NotificationsPage role="barangay" />
        )}

        {activeSection === "schedule" && (
          <BarangaySchedulePage schedule={barangaySchedule} barangay={profile?.barangay} />
        )}

        {activeSection === "leaderboard" && <LeaderboardSection />}

        <style>{`
          .input-field {
            margin-top: 8px;
            width: 100%;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 12px 16px;
            outline: none;
            background: white;
          }

          .input-field:focus {
            border-color: #22c55e;
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
          }
        `}</style>
      </main>
    </div>
  );
}

function SubmitRequestForm({ profile, schedule, onSuccess }) {
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
      const safeBarangay = profile.barangay.replaceAll(" ", "-").toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
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

    if (!form.request_title || !form.estimated_weight) {
      setMessage("Please complete the request title and estimated weight.");
      setMessageType("error");
      return;
    }

    setSaving(true);

    try {
      const uploadedUrls = await uploadPhotos();

      const { error } = await supabase.from("collection_requests").insert([
        {
          request_title: form.request_title,
          barangay: profile.barangay,
          collection_point: form.collection_point,
          waste_type: form.waste_type,
          estimated_weight: form.estimated_weight,
          sacks_count: form.sacks_count,
          preferred_pickup_date: form.preferred_pickup_date || null,
          remarks: form.remarks,
          status: "Pending",
          image_url: uploadedUrls[0] || null,
          image_urls: uploadedUrls,
          schedule_group: schedule?.group || null,
          route_schedule: schedule?.assignedDropOffSchedule || schedule?.group || null,
          allowed_waste_category: schedule?.wasteCategory || null,
          submitted_by: profile.id,
        },
      ]);

      if (error) {
        setMessage(error.message);
        setMessageType("error");
        return;
      }

      const { data: notifData, error: notifError } = await supabase
        .from("notifications")
        .insert([
          {
            role: "lgu_admin",
            title: "New Collection Request",
            message: `${profile.barangay} submitted a new waste collection request.`,
            type: "request",
            is_read: false,
          },
        ])
        .select();

      console.log("Notification result:", notifData, notifError);

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
          Barangay personnel may request LGU pickup once waste has been gathered at the barangay collection point.
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

          <p className="text-sm text-gray-600 mt-1">
            {schedule.description}
          </p>

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
          className={`mb-5 px-4 py-3 rounded-2xl text-sm ${messageType === "success"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
            }`}
        >
          {message}
        </div>
      )}

      <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput label="Request Title" placeholder="e.g. Barangay waste pickup request" value={form.request_title} onChange={(value) => updateField("request_title", value)} />

        <SelectField label="Waste Type" value={form.waste_type} onChange={(value) => updateField("waste_type", value)} options={["Recyclable", "Plastic", "Metal", "Glass", "Biodegradable", "Residual", "Mixed Waste"]} />

        <SelectField label="Collection Point" value={form.collection_point} onChange={(value) => updateField("collection_point", value)} options={["Barangay Hall", "Materials Recovery Facility (MRF)", "Designated Drop-off Area", "Temporary Collection Site"]} />

        <div>
          <label className="text-sm font-medium text-gray-600">Preferred Pickup Date</label>
          <input type="date" value={form.preferred_pickup_date} onChange={(e) => updateField("preferred_pickup_date", e.target.value)} className="input-field" />
        </div>

        <FormInput label="Estimated Weight" placeholder="e.g. 20" value={form.estimated_weight} onChange={(value) => updateField("estimated_weight", value)} />

        <FormInput label="Number of Sacks / Containers" placeholder="e.g. 10 sacks" value={form.sacks_count} onChange={(value) => updateField("sacks_count", value)} />

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-600">Remarks</label>
          <textarea rows="4" placeholder="Add remarks such as estimated sacks, waste condition, or pickup instructions..." value={form.remarks} onChange={(e) => updateField("remarks", e.target.value)} className="input-field resize-none" />
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

function BarangayScheduleCard({ schedule, barangay }) {
  if (!schedule) {
    return (
      <div className="xl:col-span-3 bg-white rounded-3xl shadow-sm border p-6">
        <h3 className="text-xl font-bold">Assigned Collection Schedule</h3>
        <p className="text-sm text-gray-500 mt-1">
          No schedule detected yet for {barangay || "this barangay"}.
        </p>
      </div>
    );
  }

  return (
    <div className="xl:col-span-3 bg-gradient-to-br from-green-700 to-green-900 text-white rounded-3xl shadow-sm p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <p className="text-green-100 text-sm">Assigned MENRO Collection Schedule</p>
          <h3 className="text-3xl font-bold mt-1">{barangay}</h3>
          <p className="text-green-100 mt-2">
            Your barangay is assigned to the {schedule.group} collection route.
          </p>
        </div>

        <div className="bg-white/15 rounded-2xl p-5 min-w-[260px]">
          <p className="text-green-100 text-sm">Collection Group</p>
          <h4 className="text-2xl font-bold">{schedule.group}</h4>
          <p className="text-green-100 text-sm mt-1">{schedule.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <ScheduleMiniCard label="Time" value={schedule.time} />
        <ScheduleMiniCard label="Allowed Waste" value={schedule.wasteCategory} />
        <ScheduleMiniCard label="Route Assignment" value={schedule.assignedDropOffSchedule || schedule.group} />
      </div>

      <div className="mt-6 bg-white/10 rounded-2xl p-4">
        <p className="font-semibold">Reminder</p>
        <p className="text-green-100 text-sm mt-1">
          Please gather waste at the designated barangay collection point before the assigned MENRO truck schedule.
        </p>
      </div>
    </div>
  );
}

function BarangaySchedulePage({ schedule, barangay }) {
  return (
    <div className="grid grid-cols-1 gap-6">
      <BarangayScheduleCard schedule={schedule} barangay={barangay} />

      {schedule && (
        <div className="bg-white rounded-3xl shadow-sm border p-6">
          <h3 className="text-xl font-bold">Covered Barangays</h3>
          <p className="text-sm text-gray-500 mb-5">
            Barangays included in this MENRO collection route.
          </p>

          <div className="flex flex-wrap gap-2">
            {schedule.barangays?.map((item) => (
              <span
                key={item}
                className="bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full text-xs font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleMiniCard({ label, value }) {
  return (
    <div className="bg-white/15 rounded-2xl p-4">
      <p className="text-green-100 text-sm">{label}</p>
      <p className="font-bold mt-1">{value}</p>
    </div>
  );
}

function TrackRequestsTable({ requests, loading, full }) {
  return (
    <div className={`${full ? "" : "xl:col-span-2"} bg-white rounded-3xl shadow-sm border overflow-hidden`}>
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
                <td className="p-4 text-gray-500" colSpan="9">Loading requests...</td>
              </tr>
            )}

            {!loading && requests.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="9">No collection requests yet.</td>
              </tr>
            )}

            {!loading && requests.map((request) => {
              const photos = request.image_urls || [];

              return (
                <tr key={request.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-semibold text-green-700">
                    CR-{String(request.id).padStart(3, "0")}
                  </td>
                  <td className="p-4">{request.request_title}</td>
                  <td className="p-4 text-gray-600">{request.collection_point}</td>
                  <td className="p-4">{request.waste_type}</td>
                  <td className="p-4 font-semibold">{formatKg(request.estimated_weight)}</td>
                  <td className="p-4 text-gray-600">{request.schedule_group || "N/A"}</td>
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
                      <a href={request.image_url} target="_blank" rel="noreferrer" className="text-green-700 font-semibold text-sm">
                        View Photo
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">No photo</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-500">{formatDate(request.created_at)}</td>
                  <td className="p-4"><StatusBadge status={request.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LeaderboardSection() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <LeaderboardCard />
      <div className="bg-white rounded-3xl shadow-sm border p-6">
        <h3 className="text-xl font-bold">Ranking Criteria</h3>
        <p className="text-sm text-gray-500 mb-5">
          Barangay ranking is based on collection completion, reporting accuracy, and coordination.
        </p>

        <div className="space-y-4">
          <OverviewCard title="Completion Rate" value="40%" />
          <OverviewCard title="Reporting Accuracy" value="30%" />
          <OverviewCard title="Timely Coordination" value="20%" />
          <OverviewCard title="Photo Documentation" value="10%" />
        </div>
      </div>
    </div>
  );
}

function LeaderboardCard() {
  return (
    <div className="bg-gradient-to-br from-green-700 to-green-900 text-white rounded-3xl shadow-sm p-6">
      <h3 className="text-xl font-bold">Barangay Performance</h3>
      <p className="text-green-100 text-sm mt-1">
        Current barangay ranking for waste management.
      </p>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <p className="text-5xl font-bold">#2</p>
          <p className="text-green-100 mt-1">Current Rank</p>
        </div>
        <Trophy size={60} className="text-yellow-300" />
      </div>

      <div className="mt-6 bg-white/10 rounded-2xl p-4">
        <p className="text-sm text-green-100">Performance Points</p>
        <p className="text-2xl font-bold">91 pts</p>
      </div>
    </div>
  );
}

function SelectField({ label, options, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <select className="input-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </div>
  );
}

function FormInput({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="input-field" />
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition ${active ? "bg-green-600 shadow-lg" : "text-green-100 hover:bg-green-900"}`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function StatCard({ title, value, note, icon, color }) {
  const styles = {
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-5">
        <div className={`w-13 h-13 rounded-2xl ${styles[color]} flex items-center justify-center p-3`}>
          {icon}
        </div>
        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">Live</span>
      </div>

      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-3xl font-bold mt-1">{value}</h3>
      <p className="text-sm text-gray-400 mt-2">{note}</p>
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

  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>{status}</span>;
}

function OverviewCard({ title, value }) {
  return (
    <div className="border rounded-2xl p-5 bg-gray-50">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-xl font-bold text-green-700 mt-2">{value}</h3>
    </div>
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

function getPageTitle(activeSection) {
  const titles = {
    dashboard: "Barangay Dashboard",
    submit: "Submit Collection Request",
    track: "Track Collection Requests",
    notifications: "Notifications",
    schedule: "Collection Schedule",
    leaderboard: "Barangay Leaderboard",
  };

  return titles[activeSection];
}

function getPageSubtitle(activeSection) {
  const subtitles = {
    dashboard:
      "Manage collection requests, monitor schedules, and coordinate with LGU waste collection teams.",
    submit:
      "Request LGU pickup once waste has been gathered at the barangay collection point.",
    track:
      "Monitor submitted pickup requests and their current collection status.",
    notifications:
      "View request updates, collection status, and LGU announcements.",
    schedule:
      "View your assigned MENRO waste collection schedule.",
    leaderboard:
      "View barangay performance ranking and scoring criteria.",
  };

  return subtitles[activeSection];
}