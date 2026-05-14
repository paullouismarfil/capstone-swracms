import { useEffect, useState } from "react";
import NotificationBell from "../components/NotificationBell";
import NotificationsPage from "../components/NotificationsPage";
import {
  searchCollectionRequests,
  searchWasteRecords,
} from "../utils/searchHelpers";
import { supabase } from "../lib/supabase";
import {
  LayoutDashboard,
  CalendarDays,
  Truck,
  ClipboardCheck,
  CheckCircle,
  Clock,
  Bell,
  Search,
  Camera,
  Scale,
  PackageCheck,
  Send,
  FileText,
  Route,
} from "lucide-react";

export default function CollectionStaffPortal() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("All Routes");

  useEffect(() => {
    fetchAssignedRequests();
    fetchWasteRecords();
  }, []);

  async function fetchAssignedRequests() {
    setLoading(true);

    const { data, error } = await supabase
      .from("collection_requests")
      .select("*")
      .in("status", ["Scheduled", "In Progress"])
      .order("created_at", { ascending: false });

    if (!error) setAssignedRequests(data || []);
    setLoading(false);
  }

  async function fetchWasteRecords() {
    const { data, error } = await supabase
      .from("waste_records")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setHistoryRecords(data || []);
  }

  async function updateRequestStatus(id, status) {
    const requestData = assignedRequests.find((item) => item.id === id);

    const { error } = await supabase
      .from("collection_requests")
      .update({ status })
      .eq("id", id);

    if (!error) {
      if (status === "In Progress") {
        await supabase.from("notifications").insert([
          {
            role: "barangay",
            title: "Collection In Progress",
            message: `${
              requestData?.barangay || "Barangay"
            } waste collection is now in progress.`,
            type: "collection_progress",
            is_read: false,
          },
        ]);
      }

      if (status === "Collected") {
        await supabase.from("notifications").insert([
          {
            role: "barangay",
            title: "Waste Successfully Collected",
            message: `${
              requestData?.barangay || "Barangay"
            } waste request has been collected by MENRO.`,
            type: "collection_complete",
            is_read: false,
          },
        ]);

        await supabase.from("notifications").insert([
          {
            role: "lgu_admin",
            title: "Collection Completed",
            message: `${
              requestData?.barangay || "Barangay"
            } request has been completed by collection staff.`,
            type: "collection_complete",
            is_read: false,
          },
        ]);
      }

      fetchAssignedRequests();
      fetchWasteRecords();
    }
  }

  const routeOptions = [
    "All Routes",
    ...new Set(assignedRequests.map((r) => r.schedule_group).filter(Boolean)),
  ];

  const filteredRequests =
    selectedRoute === "All Routes"
      ? assignedRequests
      : assignedRequests.filter((r) => r.schedule_group === selectedRoute);

  const searchedRequests = searchCollectionRequests(
    filteredRequests,
    searchTerm
  );

  const searchedHistoryRecords = searchWasteRecords(
    historyRecords,
    searchTerm
  );

  const inProgressCount = searchedRequests.filter(
    (r) => r.status === "In Progress"
  ).length;

  const scheduledCount = searchedRequests.filter(
    (r) => r.status === "Scheduled"
  ).length;

  return (
    <div className="min-h-screen bg-[#f4f7f3] flex text-gray-900">
      <aside className="hidden lg:flex w-72 bg-green-950 text-white flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-green-700 flex items-center justify-center">
            <Truck size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">SWRaCMS</h1>
            <p className="text-xs text-green-200">Collection Staff Portal</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={activeSection === "dashboard"}
            onClick={() => setActiveSection("dashboard")}
          />

          <SidebarItem
            icon={<CalendarDays size={20} />}
            label="Assigned Requests"
            active={activeSection === "assigned"}
            onClick={() => setActiveSection("assigned")}
          />

          <SidebarItem
            icon={<ClipboardCheck size={20} />}
            label="Update Status"
            active={activeSection === "status"}
            onClick={() => setActiveSection("status")}
          />

          <SidebarItem
            icon={<Bell size={20} />}
            label="Notifications"
            active={activeSection === "notifications"}
            onClick={() => setActiveSection("notifications")}
          />

          <SidebarItem
            icon={<Scale size={20} />}
            label="Waste Recording"
            active={activeSection === "recording"}
            onClick={() => setActiveSection("recording")}
          />

          <SidebarItem
            icon={<FileText size={20} />}
            label="Collection History"
            active={activeSection === "history"}
            onClick={() => setActiveSection("history")}
          />
        </nav>

        <div className="bg-green-900 rounded-2xl p-4 mt-6">
          <p className="text-sm font-semibold">LGU Garbage Truck</p>
          <p className="text-xs text-green-200 mt-1">
            One MENRO truck follows the assigned municipal route schedule.
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

            <NotificationBell role="collector" />

            <div className="bg-green-700 text-white px-4 py-3 rounded-2xl shadow">
              MENRO Team
            </div>
          </div>
        </header>

        {activeSection === "dashboard" && (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
              <StatCard
                title="Assigned Pickups"
                value={searchedRequests.length}
                note="Filtered scheduled requests"
                icon={<CalendarDays size={26} />}
                color="blue"
              />

              <StatCard
                title="Scheduled"
                value={scheduledCount}
                note="Ready for pickup"
                icon={<Clock size={26} />}
                color="orange"
              />

              <StatCard
                title="In Progress"
                value={inProgressCount}
                note="Currently collecting"
                icon={<Truck size={26} />}
                color="blue"
              />

              <StatCard
                title="Completed Records"
                value={searchedHistoryRecords.length}
                note="Recorded waste collections"
                icon={<CheckCircle size={26} />}
                color="green"
              />
            </section>

            <RouteFilterPanel
              selectedRoute={selectedRoute}
              setSelectedRoute={setSelectedRoute}
              routeOptions={routeOptions}
              filteredRequests={filteredRequests}
            />

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <AssignedRequestsTable
                requests={searchedRequests.slice(0, 5)}
                loading={loading}
                onStatusChange={updateRequestStatus}
              />

              <TodaySummary
                assigned={searchedRequests.length}
                inProgress={inProgressCount}
                completed={searchedHistoryRecords.length}
                route={selectedRoute}
              />

              <CollectionHistory records={searchedHistoryRecords.slice(0, 5)} />
            </section>
          </>
        )}

        {activeSection === "assigned" && (
          <>
            <RouteFilterPanel
              selectedRoute={selectedRoute}
              setSelectedRoute={setSelectedRoute}
              routeOptions={routeOptions}
              filteredRequests={filteredRequests}
            />

            <AssignedRequestsTable
              requests={searchedRequests}
              loading={loading}
              full
              onStatusChange={updateRequestStatus}
            />
          </>
        )}

        {activeSection === "status" && (
          <QuickStatusUpdate
            requests={searchedRequests}
            onStatusChange={updateRequestStatus}
          />
        )}

        {activeSection === "notifications" && (
          <NotificationsPage role="collector" />
        )}

        {activeSection === "recording" && (
          <WasteRecordingForm
            requests={searchedRequests}
            onSuccess={() => {
              fetchAssignedRequests();
              fetchWasteRecords();
              setActiveSection("history");
            }}
          />
        )}

        {activeSection === "history" && (
          <CollectionHistory records={searchedHistoryRecords} full />
        )}

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

function RouteFilterPanel({
  selectedRoute,
  setSelectedRoute,
  routeOptions,
  filteredRequests,
}) {
  const scheduled = filteredRequests.filter(
    (r) => r.status === "Scheduled"
  ).length;

  const inProgress = filteredRequests.filter(
    (r) => r.status === "In Progress"
  ).length;

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <Route className="text-green-700" size={26} />
            <h3 className="text-xl font-bold">MENRO Route Assignment</h3>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Filter scheduled pickup requests based on municipal collection
            routes.
          </p>
        </div>

        <div className="w-full lg:w-80">
          <label className="text-sm font-medium text-gray-600">
            Filter Collection Route
          </label>

          <select
            className="input-field"
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
          >
            {routeOptions.map((route) => (
              <option key={route}>{route}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <RouteSummaryCard label="Current Route" value={selectedRoute} />
        <RouteSummaryCard
          label="Filtered Requests"
          value={filteredRequests.length}
        />
        <RouteSummaryCard label="Scheduled Pickups" value={scheduled} />
        <RouteSummaryCard label="In Progress" value={inProgress} />
      </div>
    </div>
  );
}

function RouteSummaryCard({ label, value }) {
  return (
    <div className="border rounded-2xl p-5 bg-gray-50">
      <p className="text-sm text-gray-500">{label}</p>
      <h3 className="text-xl font-bold text-green-700 mt-2">{value}</h3>
    </div>
  );
}

function AssignedRequestsTable({ requests, loading, full, onStatusChange }) {
  return (
    <div
      className={`${
        full ? "" : "xl:col-span-2"
      } bg-white rounded-3xl shadow-sm border overflow-hidden`}
    >
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Assigned Pickup Requests</h3>
          <p className="text-sm text-gray-500">
            Live requests scheduled by MENRO/LGU for collection.
          </p>
        </div>

        <button className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm">
          Route Filter Active
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1150px]">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="p-4 text-left">Request ID</th>
              <th className="p-4 text-left">Barangay</th>
              <th className="p-4 text-left">Collection Point</th>
              <th className="p-4 text-left">Waste Type</th>
              <th className="p-4 text-left">Route Group</th>
              <th className="p-4 text-left">Allowed Waste</th>
              <th className="p-4 text-left">Estimated</th>
              <th className="p-4 text-left">Preferred Date</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="10">
                  Loading assigned requests...
                </td>
              </tr>
            )}

            {!loading && requests.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="10">
                  No scheduled collection requests for this route.
                </td>
              </tr>
            )}

            {!loading &&
              requests.map((task) => (
                <tr key={task.id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-semibold text-green-700">
                    CR-{String(task.id).padStart(3, "0")}
                  </td>
                  <td className="p-4 font-semibold">{task.barangay}</td>
                  <td className="p-4 text-gray-600">
                    {task.collection_point}
                  </td>
                  <td className="p-4">{task.waste_type}</td>
                  <td className="p-4">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      {task.schedule_group || "N/A"}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600">
                    {task.allowed_waste_category || "N/A"}
                  </td>
                  <td className="p-4 font-semibold">
                    {formatKg(task.estimated_weight)}
                  </td>
                  <td className="p-4 text-gray-500">
                    {task.preferred_pickup_date || "No date"}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 flex-wrap">
                      {task.status === "Scheduled" && (
                        <button
                          onClick={() =>
                            onStatusChange(task.id, "In Progress")
                          }
                          className="text-blue-700 font-semibold text-sm"
                        >
                          Start
                        </button>
                      )}

                      {task.status === "In Progress" && (
                        <button
                          onClick={() =>
                            onStatusChange(task.id, "Collected")
                          }
                          className="text-green-700 font-semibold text-sm"
                        >
                          Mark Collected
                        </button>
                      )}

                      <button
                        onClick={() => onStatusChange(task.id, "Missed")}
                        className="text-red-600 font-semibold text-sm"
                      >
                        Missed
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuickStatusUpdate({ requests, onStatusChange }) {
  const [requestId, setRequestId] = useState("");
  const [status, setStatus] = useState("In Progress");
  const [message, setMessage] = useState("");

  async function handleUpdate() {
    if (!requestId) {
      setMessage("Please select a request.");
      return;
    }

    await onStatusChange(Number(requestId), status);
    setMessage("Status updated successfully.");
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
            {requests.map((request) => (
              <option key={request.id} value={request.id}>
                CR-{String(request.id).padStart(3, "0")} - {request.barangay} -{" "}
                {request.schedule_group || "No Route"}
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
          className="w-full bg-green-700 text-white px-5 py-3 rounded-2xl shadow hover:bg-green-800 flex items-center justify-center gap-2"
        >
          <PackageCheck size={18} />
          Update Status
        </button>
      </div>
    </div>
  );
}

function WasteRecordingForm({ requests, onSuccess }) {
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

    if (!form.actual_weight) {
      setMessage("Please enter the actual weight collected.");
      setMessageType("error");
      return;
    }

    setSaving(true);

    try {
      const photoUrl = await uploadCompletionPhoto();

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id || null;

      const { error: recordError } = await supabase.from("waste_records").insert([
        {
          route_name: selectedRequest.barangay,
          collection_point: selectedRequest.collection_point,
          waste_type:
            form.waste_type || selectedRequest.waste_type || "Plastic",
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

      await supabase.from("notifications").insert([
        {
          role: "barangay",
          title: "Waste Successfully Collected",
          message: `${
            selectedRequest?.barangay || "Barangay"
          } waste request has been collected by MENRO.`,
          type: "collection_complete",
          is_read: false,
        },
      ]);

      await supabase.from("notifications").insert([
        {
          role: "lgu_admin",
          title: "Collection Completed",
          message: `${
            selectedRequest?.barangay || "Barangay"
          } request has been completed by collection staff.`,
          type: "collection_complete",
          is_read: false,
        },
      ]);

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
            {requests.map((request) => (
              <option key={request.id} value={request.id}>
                CR-{String(request.id).padStart(3, "0")} - {request.barangay} -{" "}
                {request.schedule_group || "No Route"}
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
          value={form.waste_type || selectedRequest?.waste_type || "Plastic"}
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
            disabled={saving}
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

function TodaySummary({ assigned, inProgress, completed, route }) {
  return (
    <div className="bg-gradient-to-br from-green-700 to-green-900 text-white rounded-3xl shadow-sm p-6">
      <h3 className="text-xl font-bold">Today’s Route Summary</h3>
      <p className="text-green-100 text-sm mt-1">
        Current collection progress for the single MENRO truck.
      </p>

      <div className="mt-6 space-y-4">
        <SummaryRow label="Current Route" value={route} />
        <SummaryRow label="Assigned Requests" value={assigned} />
        <SummaryRow label="In Progress" value={inProgress} />
        <SummaryRow label="Completed Records" value={completed} />
      </div>
    </div>
  );
}

function CollectionHistory({ records, full }) {
  return (
    <div
      className={`${
        full ? "" : "xl:col-span-3"
      } bg-white rounded-3xl shadow-sm border overflow-hidden`}
    >
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Recent Collection Records</h3>
          <p className="text-sm text-gray-500">
            Actual waste collection records encoded by collection staff.
          </p>
        </div>

        <button className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm">
          History
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px]">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="p-4 text-left">Record ID</th>
              <th className="p-4 text-left">Route / Barangay</th>
              <th className="p-4 text-left">Waste Type</th>
              <th className="p-4 text-left">Actual Weight</th>
              <th className="p-4 text-left">Date</th>
              <th className="p-4 text-left">Photo</th>
              <th className="p-4 text-left">Remarks</th>
            </tr>
          </thead>

          <tbody>
            {records.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="7">
                  No collection records yet.
                </td>
              </tr>
            )}

            {records.map((record) => (
              <tr key={record.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-semibold text-green-700">
                  REC-{String(record.id).padStart(3, "0")}
                </td>
                <td className="p-4 font-semibold">{record.route_name}</td>
                <td className="p-4">{record.waste_type}</td>
                <td className="p-4 font-bold text-green-700">
                  {formatKg(record.actual_weight)}
                </td>
                <td className="p-4 text-gray-500">
                  {record.collected_date}
                </td>
                <td className="p-4">
                  {record.photo_url ? (
                    <a
                      href={record.photo_url}
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
                <td className="p-4 text-gray-600">{record.remarks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatKg(value) {
  if (value === null || value === undefined || value === "") return "N/A";

  const text = String(value).trim();

  if (text.toLowerCase().includes("kg")) return text;

  return `${text} kg`;
}

function SelectField({ label, options, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>

      <select
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function FormInput({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
      />
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition ${
        active ? "bg-green-600 shadow-lg" : "text-green-100 hover:bg-green-900"
      }`}
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
        <div
          className={`w-13 h-13 rounded-2xl ${styles[color]} flex items-center justify-center p-3`}
        >
          {icon}
        </div>

        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">
          Live
        </span>
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
      : status === "In Progress"
      ? "bg-yellow-100 text-yellow-700"
      : status === "Missed"
      ? "bg-red-100 text-red-600"
      : "bg-orange-100 text-orange-600";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between bg-white/10 rounded-2xl p-4">
      <p className="text-green-100">{label}</p>
      <p className="text-lg font-bold text-right max-w-[180px]">{value}</p>
    </div>
  );
}

function getPageTitle(activeSection) {
  const titles = {
    dashboard: "Collection Staff Dashboard",
    assigned: "Assigned Pickup Requests",
    status: "Update Collection Status",
    notifications: "Notifications",
    recording: "Waste Recording",
    history: "Collection History",
  };

  return titles[activeSection];
}

function getPageSubtitle(activeSection) {
  const subtitles = {
    dashboard:
      "View live assigned pickup requests, filter by route, update progress, and record actual collected waste.",
    assigned:
      "Review scheduled barangay requests assigned to the MENRO collection team.",
    status:
      "Update the status of assigned collection requests after pickup operations.",
    notifications:
      "View assigned pickup alerts, route updates, and completed collection notifications.",
    recording:
      "Encode actual waste collected after the LGU garbage truck completes pickup.",
    history:
      "Review previously encoded waste collection records.",
  };

  return subtitles[activeSection];
}