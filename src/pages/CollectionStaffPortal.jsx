import { useEffect, useMemo, useState } from "react";
import NotificationsPage from "../components/NotificationsPage";
import EcoBot from "../components/chatbot/EcoBot";
import {
  searchCollectionRequests,
  searchWasteRecords,
} from "../utils/searchHelpers";
import { supabase } from "../lib/supabase";

import CollectorSidebar from "../components/collector/CollectorSidebar";
import CollectorHeader from "../components/collector/CollectorHeader";
import CollectorStatCard from "../components/collector/CollectorStatCard";
import RouteFilterPanel from "../components/collector/RouteFilterPanel";
import AssignedRequestsTable from "../components/collector/AssignedRequestsTable";
import QuickStatusUpdate from "../components/collector/QuickStatusUpdate";
import WasteRecordingForm from "../components/collector/WasteRecordingForm";
import TodaySummary from "../components/collector/TodaySummary";
import CollectionHistory from "../components/collector/CollectionHistory";

import { CalendarDays, CheckCircle, Clock, Truck } from "lucide-react";

const COLLECTOR_ACTIVE_SECTION_KEY = "collectorActiveSection";

const VALID_COLLECTOR_SECTIONS = [
  "dashboard",
  "assigned",
  "status",
  "notifications",
  "recording",
  "history",
];

const DEFAULT_TRUCKS = [
  {
    id: "truck_1",
    truckCode: "truck_1",
    name: "Truck 1",
    label: "Recyclable Waste Truck",
    assignedWaste: "Plastic, Metal, Glass, Paper, Cardboard, Recyclable Waste",
    shortLabel: "Recyclable",
    status: "available",
    color: "#15803d",
    bgClass: "bg-green-50",
    textClass: "text-green-700",
  },
  {
    id: "truck_2",
    truckCode: "truck_2",
    name: "Truck 2",
    label: "Biodegradable Waste Truck",
    assignedWaste: "Food Waste, Leaves, Fruit Peels, Vegetable Scraps",
    shortLabel: "Biodegradable",
    status: "available",
    color: "#ca8a04",
    bgClass: "bg-yellow-50",
    textClass: "text-yellow-700",
  },
  {
    id: "truck_3",
    truckCode: "truck_3",
    name: "Truck 3",
    label: "Residual / Non-Biodegradable Truck",
    assignedWaste: "Residual Waste, Wrappers, Sachets, Non-Recyclable Plastics",
    shortLabel: "Residual",
    status: "available",
    color: "#2563eb",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
  },
  {
    id: "truck_4",
    truckCode: "truck_4",
    name: "Truck 4",
    label: "Backup / Special Collection Truck",
    assignedWaste: "Backup, Overflow, Special, Emergency, or Unclassified Waste",
    shortLabel: "Backup",
    status: "available",
    color: "#dc2626",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
  },
];

const TRUCK_STATUS_OPTIONS = [
  "available",
  "on_route",
  "under_maintenance",
  "unavailable",
  "backup_active",
];

function getSavedCollectorSection() {
  const savedSection = localStorage.getItem(COLLECTOR_ACTIVE_SECTION_KEY);

  if (VALID_COLLECTOR_SECTIONS.includes(savedSection)) {
    return savedSection;
  }

  return "dashboard";
}

export default function CollectionStaffPortal() {
  const [activeSection, setActiveSection] = useState(getSavedCollectorSection);
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("All Routes");

  const [collectorProfile, setCollectorProfile] = useState(null);
  const [collectorEmail, setCollectorEmail] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [collectionTrucks, setCollectionTrucks] = useState(DEFAULT_TRUCKS);
  const [collectorTruck, setCollectorTruck] = useState(null);

  useEffect(() => {
    loadCollectorProfile();
  }, []);

  useEffect(() => {
    localStorage.setItem(COLLECTOR_ACTIVE_SECTION_KEY, activeSection);

    if (!["assigned", "status", "recording", "history"].includes(activeSection)) {
      setSearchTerm("");
    }
  }, [activeSection]);

  async function loadCollectorProfile() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      window.location.href = "/";
      return;
    }

    const loginEmail = String(user.email || "").toLowerCase();
    setCollectorEmail(loginEmail);

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", loginEmail)
      .maybeSingle();

    if (error || !profileData) {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      localStorage.removeItem(COLLECTOR_ACTIVE_SECTION_KEY);
      alert("This account is not registered in the system.");
      window.location.href = "/";
      return;
    }

    if (profileData.role !== "collection_staff") {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      localStorage.removeItem(COLLECTOR_ACTIVE_SECTION_KEY);
      alert("Access denied. This account is not allowed to open Collector Portal.");
      window.location.href = "/";
      return;
    }

    if (profileData.status !== "active") {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      localStorage.removeItem(COLLECTOR_ACTIVE_SECTION_KEY);
      alert("Your account is not active. Please contact the MENRO Admin.");
      window.location.href = "/";
      return;
    }

    setCollectorProfile(profileData);

    const trucks = await fetchCollectionTrucks();
    const assignedTruck = findCollectorAssignedTruck(trucks, loginEmail);

    setCollectorTruck(assignedTruck || null);

    fetchAssignedRequests();
    fetchWasteRecords();
  }

  async function fetchCollectionTrucks() {
    const { data, error } = await supabase
      .from("collection_trucks")
      .select("*")
      .order("truck_code", { ascending: true });

    if (error) {
      console.error("Collection trucks fetch error:", error);
      setCollectionTrucks(DEFAULT_TRUCKS);
      return DEFAULT_TRUCKS;
    }

    const mergedTrucks = mergeTruckData(data || []);
    setCollectionTrucks(mergedTrucks);

    return mergedTrucks;
  }

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

  async function autoRecordWasteIfNeeded(requestData) {
    if (!requestData?.id) return;

    const requestId = String(requestData.id);

    const { data: existingRecord, error: checkError } = await supabase
      .from("waste_records")
      .select("id")
      .eq("request_id", requestId)
      .maybeSingle();

    if (checkError) {
      console.error("Waste record check error:", checkError);
      return;
    }

    if (existingRecord) return;

    const { error: insertError } = await supabase.from("waste_records").insert([
      {
        request_id: requestId,
        route_name:
          requestData?.barangay ||
          requestData?.route_name ||
          requestData?.schedule_group ||
          "Unspecified",
        waste_type: requestData?.waste_type || "Unspecified",
        actual_weight:
          requestData?.actual_weight ||
          requestData?.estimated_weight ||
          requestData?.weight ||
          requestData?.quantity ||
          0,
        collected_date: new Date().toISOString(),
        remarks: "Auto-recorded when collector marked request as collected.",
      },
    ]);

    if (insertError) {
      console.error("Waste record insert error:", insertError);
      alert("Request was collected, but waste record failed to save.");
    }
  }

  async function updateRequestStatus(id, status) {
    const requestData = assignedRequests.find(
      (item) => String(item.id) === String(id)
    );

    if (!requestData) {
      alert("Request not found.");
      return;
    }

    const requestAssignment = requestAssignments.find(
      (item) => String(item.id) === String(id)
    );

    if (requestAssignment?.needsReschedule) {
      alert(
        "This request needs rescheduling because the assigned truck is unavailable and the backup truck is already active."
      );
      return;
    }

    if (
      requestData.status === "Collected" ||
      requestData.status === "Improper Segregation"
    ) {
      alert("This request is already finalized and can no longer be changed.");
      return;
    }

    const { error } = await supabase
      .from("collection_requests")
      .update({ status })
      .eq("id", Number(id));

    if (error) {
      console.error("Update request status error:", error);
      alert("Failed to update request status.");
      return;
    }

    if (status === "In Progress") {
      if (requestData.submitted_by) {
        await supabase.from("notifications").insert([
          {
            user_id: requestData.submitted_by,
            title: "Collection In Progress",
            message: `${
              requestData?.barangay || "Barangay"
            } waste collection is now in progress. Please make sure waste is properly segregated before pickup.`,
            type: "collection_progress",
            is_read: false,
          },
        ]);
      }
    }

    if (status === "Improper Segregation") {
      const notificationRows = [];

      if (requestData.submitted_by) {
        notificationRows.push({
          user_id: requestData.submitted_by,
          title: "Waste Not Collected",
          message: `${
            requestData?.barangay || "Your barangay"
          } waste was not collected because it was not properly segregated. Please separate waste according to MENRO guidelines before the next collection schedule.`,
          type: "improper_segregation",
          is_read: false,
        });
      }

      notificationRows.push({
        role: "lgu_admin",
        title: "Improper Waste Segregation",
        message: `${
          requestData?.barangay || "Barangay"
        } was marked as not collected due to improper waste segregation.`,
        type: "improper_segregation",
        is_read: false,
      });

      if (notificationRows.length > 0) {
        await supabase.from("notifications").insert(notificationRows);
      }

      fetchAssignedRequests();
      fetchWasteRecords();
      return;
    }

    if (status === "Collected") {
      const notificationRows = [];

      if (requestData.submitted_by) {
        notificationRows.push({
          user_id: requestData.submitted_by,
          title: "Waste Successfully Collected",
          message: `${
            requestData?.barangay || "Barangay"
          } waste request has been collected by MENRO.`,
          type: "collection_complete",
          is_read: false,
        });
      }

      notificationRows.push({
        role: "lgu_admin",
        title: "Collection Completed",
        message: `${
          requestData?.barangay || "Barangay"
        } request has been completed by collection staff.`,
        type: "collection_complete",
        is_read: false,
      });

      await supabase.from("notifications").insert(notificationRows);

      await autoRecordWasteIfNeeded(requestData);
    }

    fetchAssignedRequests();
    fetchWasteRecords();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("pendingRole");
    localStorage.removeItem(COLLECTOR_ACTIVE_SECTION_KEY);
    window.location.href = "/";
  }

  async function handleChangePassword() {
    if (!collectorEmail) {
      alert("No email found for this account.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(collectorEmail, {
      redirectTo: window.location.origin,
    });

    if (error) {
      console.error(error);
      alert("Failed to send password reset email.");
      return;
    }

    alert("Password reset email sent to " + collectorEmail);
  }

  const trucksById = useMemo(() => {
    return collectionTrucks.reduce((map, truck) => {
      map[truck.id] = truck;
      return map;
    }, {});
  }, [collectionTrucks]);

  const requestAssignments = useMemo(() => {
    return assignRequestsToEffectiveTrucks(assignedRequests, trucksById);
  }, [assignedRequests, trucksById]);

  const collectorAssignedRequests = useMemo(() => {
    if (!collectorTruck) return [];

    return requestAssignments.filter((request) => {
      if (request.needsReschedule) return false;

      return request.assignedTruck?.id === collectorTruck.id;
    });
  }, [requestAssignments, collectorTruck]);

  const collectorHistoryRecords = useMemo(() => {
    if (!collectorTruck) return [];

    return historyRecords.filter((record) => {
      const assignedTruck = getAssignedTruck(record?.waste_type, trucksById);
      return assignedTruck.id === collectorTruck.id;
    });
  }, [historyRecords, collectorTruck, trucksById]);

  const routeOptions = [
    "All Routes",
    ...new Set(
      collectorAssignedRequests.map((r) => r.schedule_group).filter(Boolean)
    ),
  ];

  const filteredRequests =
    selectedRoute === "All Routes"
      ? collectorAssignedRequests
      : collectorAssignedRequests.filter(
          (r) => r.schedule_group === selectedRoute
        );

  const searchedRequests = searchCollectionRequests(filteredRequests, searchTerm);
  const searchedHistoryRecords = searchWasteRecords(
    collectorHistoryRecords,
    searchTerm
  );

  const inProgressCount = searchedRequests.filter(
    (r) => r.status === "In Progress"
  ).length;

  const scheduledCount = searchedRequests.filter(
    (r) => r.status === "Scheduled"
  ).length;

  const needsRescheduleCount = requestAssignments.filter(
    (request) => request.needsReschedule
  ).length;

  const showSearch = ["assigned", "status", "recording", "history"].includes(
    activeSection
  );

  const showBell = activeSection === "dashboard";

  const collectorName =
    collectorProfile?.full_name ||
    collectorProfile?.name ||
    collectorProfile?.username ||
    "Collection Staff";

  return (
    <div className="min-h-screen bg-[#f4f7f3] text-gray-900 lg:flex">
      <CollectorSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <main className="min-w-0 flex-1 w-full p-3 sm:p-5 lg:p-8 overflow-x-hidden">
        <CollectorHeader
          activeSection={activeSection}
          searchTerm={showSearch ? searchTerm : ""}
          setSearchTerm={showSearch ? setSearchTerm : undefined}
          showSearch={showSearch}
          showBell={showBell}
          collectorName={collectorName}
          collectorEmail={collectorEmail}
          onLogout={handleLogout}
          onChangePassword={handleChangePassword}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {activeSection === "dashboard" && (
          <>
            <CollectorTruckAssignmentCard
              collectorTruck={collectorTruck}
              collectorEmail={collectorEmail}
              assignedCount={collectorAssignedRequests.length}
              needsRescheduleCount={needsRescheduleCount}
            />

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-6 lg:mb-8">
              <CollectorStatCard
                title="Assigned Pickups"
                value={searchedRequests.length}
                note="Filtered by assigned truck"
                icon={<CalendarDays size={26} />}
                color="blue"
              />

              <CollectorStatCard
                title="Scheduled"
                value={scheduledCount}
                note="Ready for pickup"
                icon={<Clock size={26} />}
                color="orange"
              />

              <CollectorStatCard
                title="In Progress"
                value={inProgressCount}
                note="Currently collecting"
                icon={<Truck size={26} />}
                color="blue"
              />

              <CollectorStatCard
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

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
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
            <CollectorTruckAssignmentCard
              collectorTruck={collectorTruck}
              collectorEmail={collectorEmail}
              assignedCount={collectorAssignedRequests.length}
              needsRescheduleCount={needsRescheduleCount}
            />

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
          <>
            <CollectorTruckAssignmentCard
              collectorTruck={collectorTruck}
              collectorEmail={collectorEmail}
              assignedCount={collectorAssignedRequests.length}
              needsRescheduleCount={needsRescheduleCount}
            />

            <QuickStatusUpdate
              requests={searchedRequests}
              onStatusChange={updateRequestStatus}
            />
          </>
        )}

        {activeSection === "notifications" && (
          <NotificationsPage role="collector" />
        )}

        {activeSection === "recording" && (
          <>
            <CollectorTruckAssignmentCard
              collectorTruck={collectorTruck}
              collectorEmail={collectorEmail}
              assignedCount={collectorAssignedRequests.length}
              needsRescheduleCount={needsRescheduleCount}
            />

            <WasteRecordingForm
              requests={searchedRequests}
              onSuccess={() => {
                fetchAssignedRequests();
                fetchWasteRecords();
                setActiveSection("history");
              }}
            />
          </>
        )}

        {activeSection === "history" && (
          <>
            <CollectorTruckAssignmentCard
              collectorTruck={collectorTruck}
              collectorEmail={collectorEmail}
              assignedCount={collectorAssignedRequests.length}
              needsRescheduleCount={needsRescheduleCount}
            />

            <CollectionHistory records={searchedHistoryRecords} full />
          </>
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

      <EcoBot role="Collection Staff" botName="Smart Assist" />
    </div>
  );
}

function CollectorTruckAssignmentCard({
  collectorTruck,
  collectorEmail,
  assignedCount,
  needsRescheduleCount,
}) {
  const truckUnavailable =
    collectorTruck &&
    (collectorTruck.status === "under_maintenance" ||
      collectorTruck.status === "unavailable");

  if (!collectorTruck) {
    return (
      <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5">
        <p className="text-sm font-bold text-red-700">
          No truck assigned to this collector account
        </p>
        <p className="text-xs text-red-600 mt-1">
          The logged-in email{" "}
          <span className="font-semibold">{collectorEmail || "Unknown"}</span>{" "}
          is not assigned to any collection truck. Please ask the LGU/MENRO
          Admin to assign this email in the collection_trucks table.
        </p>
      </div>
    );
  }

  return (
    <div className={`mb-6 rounded-3xl border p-5 ${collectorTruck.bgClass}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="h-14 w-14 rounded-2xl text-white flex items-center justify-center text-2xl shadow-sm"
            style={{ backgroundColor: collectorTruck.color }}
          >
            🚛
          </div>

          <div>
            <p className={`text-lg font-bold ${collectorTruck.textClass}`}>
              {collectorTruck.name} - {collectorTruck.label}
            </p>

            <p className="text-sm text-gray-600 mt-1">
              Assigned Waste:{" "}
              <span className="font-semibold">
                {collectorTruck.assignedWaste}
              </span>
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Truck Status:{" "}
              <span className="font-semibold">
                {getTruckStatusLabel(collectorTruck.status)}
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 border px-4 py-3">
          <p className="text-xs text-gray-500">Your Active Tasks</p>
          <p className={`text-2xl font-bold ${collectorTruck.textClass}`}>
            {assignedCount}
          </p>
        </div>
      </div>

      {truckUnavailable && collectorTruck.id !== "truck_4" && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-bold text-red-700">
            Your assigned truck is currently unavailable
          </p>

          <p className="text-xs text-red-600 mt-1">
            {collectorTruck.name} is marked as{" "}
            <span className="font-semibold">
              {getTruckStatusLabel(collectorTruck.status)}
            </span>
            . Active routes for this truck may be reassigned to Truck 4 Backup
            or rescheduled by LGU/MENRO. Please wait for MENRO instructions.
          </p>
        </div>
      )}

      {collectorTruck.id === "truck_4" && (
        <div className="mt-4 rounded-2xl border bg-white/70 px-4 py-3">
          <p className="text-xs font-semibold text-red-700">
            Backup Truck Notice
          </p>
          <p className="text-xs text-gray-600 mt-1">
            This truck may receive backup routes when Truck 1, Truck 2, or Truck
            3 becomes unavailable. If another route needs backup while Truck 4
            is already active, MENRO must reschedule that route.
          </p>
        </div>
      )}

      {needsRescheduleCount > 0 && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-bold text-red-700">
            {needsRescheduleCount} route
            {needsRescheduleCount > 1 ? "s" : ""} need rescheduling
          </p>
          <p className="text-xs text-red-600 mt-1">
            These routes are not shown in the collector task list because they
            require LGU/MENRO rescheduling.
          </p>
        </div>
      )}
    </div>
  );
}

function mergeTruckData(databaseTrucks) {
  return DEFAULT_TRUCKS.map((defaultTruck) => {
    const foundTruck = databaseTrucks.find(
      (truck) => truck.truck_code === defaultTruck.truckCode
    );

    if (!foundTruck) return defaultTruck;

    return {
      ...defaultTruck,
      name: foundTruck.truck_name || defaultTruck.name,
      assignedWaste: foundTruck.assigned_waste || defaultTruck.assignedWaste,
      status: normalizeTruckStatus(foundTruck.status),
      assignedCollectorEmail: String(
        foundTruck.assigned_collector_email || ""
      ).toLowerCase(),
      assignedCollectorName: foundTruck.assigned_collector_name || "",
      updatedAt: foundTruck.updated_at,
    };
  });
}

function findCollectorAssignedTruck(trucks, email) {
  const normalizedEmail = String(email || "").toLowerCase();

  return trucks.find(
    (truck) =>
      String(truck.assignedCollectorEmail || "").toLowerCase() ===
      normalizedEmail
  );
}

function assignRequestsToEffectiveTrucks(requests, trucksById = {}) {
  const basicAssignments = requests.map((request) => {
    const originalAssignedTruck = getAssignedTruck(request.waste_type, trucksById);

    return {
      ...request,
      originalAssignedTruck,
      assignedTruck: originalAssignedTruck,
      isReassignedToBackup: false,
      needsReschedule: false,
      rescheduleReason: "",
    };
  });

  const backupTruck = trucksById.truck_4 || DEFAULT_TRUCKS[3];

  const unavailableMainTruckIds = ["truck_1", "truck_2", "truck_3"].filter(
    (truckId) => {
      const truck = trucksById[truckId];

      if (!truck || !isTruckUnavailableForRoute(truck.status)) {
        return false;
      }

      return basicAssignments.some(
        (request) =>
          request.originalAssignedTruck.id === truckId &&
          isActiveRouteStatus(normalizeStatus(request.status))
      );
    }
  );

  const backupCanBeUsed =
    backupTruck &&
    !isTruckUnavailableForRoute(backupTruck.status) &&
    unavailableMainTruckIds.length > 0;

  const truckIdAllowedToUseBackup = backupCanBeUsed
    ? unavailableMainTruckIds[0]
    : null;

  return basicAssignments.map((request) => {
    const originalTruck = request.originalAssignedTruck;

    if (
      originalTruck.id !== "truck_4" &&
      isTruckUnavailableForRoute(originalTruck.status)
    ) {
      if (
        backupCanBeUsed &&
        originalTruck.id === truckIdAllowedToUseBackup
      ) {
        return {
          ...request,
          assignedTruck: {
            ...backupTruck,
            status:
              normalizeTruckStatus(backupTruck.status) === "available"
                ? "backup_active"
                : backupTruck.status,
          },
          isReassignedToBackup: true,
          needsReschedule: false,
          rescheduleReason: "",
        };
      }

      return {
        ...request,
        assignedTruck: originalTruck,
        isReassignedToBackup: false,
        needsReschedule: true,
        rescheduleReason: backupCanBeUsed
          ? `${originalTruck.name} is unavailable and Truck 4 is already assigned as backup to another route. This request needs rescheduling.`
          : `${originalTruck.name} is unavailable and no backup truck is currently available. This request needs rescheduling.`,
      };
    }

    return request;
  });
}

function getAssignedTruck(wasteType, trucksById = {}) {
  const waste = String(wasteType || "").toLowerCase();

  if (
    waste.includes("recyclable") ||
    waste.includes("plastic") ||
    waste.includes("metal") ||
    waste.includes("glass") ||
    waste.includes("paper") ||
    waste.includes("cardboard") ||
    waste.includes("carton") ||
    waste.includes("bote") ||
    waste.includes("lata")
  ) {
    return trucksById.truck_1 || DEFAULT_TRUCKS[0];
  }

  if (
    waste.includes("biodegradable") ||
    waste.includes("bio") ||
    waste.includes("food") ||
    waste.includes("leaves") ||
    waste.includes("leaf") ||
    waste.includes("dahon") ||
    waste.includes("nabubulok") ||
    waste.includes("fruit") ||
    waste.includes("vegetable")
  ) {
    return trucksById.truck_2 || DEFAULT_TRUCKS[1];
  }

  if (
    waste.includes("residual") ||
    waste.includes("non-biodegradable") ||
    waste.includes("non biodegradable") ||
    waste.includes("hindi nabubulok") ||
    waste.includes("mixed") ||
    waste.includes("wrapper") ||
    waste.includes("sachet") ||
    waste.includes("non-recyclable") ||
    waste.includes("non recyclable")
  ) {
    return trucksById.truck_3 || DEFAULT_TRUCKS[2];
  }

  return trucksById.truck_4 || DEFAULT_TRUCKS[3];
}

function isTruckUnavailableForRoute(status) {
  const normalized = normalizeTruckStatus(status);

  return normalized === "under_maintenance" || normalized === "unavailable";
}

function normalizeTruckStatus(value) {
  const status = String(value || "available").trim().toLowerCase();

  if (TRUCK_STATUS_OPTIONS.includes(status)) {
    return status;
  }

  return "available";
}

function getTruckStatusLabel(status) {
  const normalized = normalizeTruckStatus(status);

  const labels = {
    available: "Available",
    on_route: "On Route",
    under_maintenance: "Under Maintenance",
    unavailable: "Unavailable",
    backup_active: "Backup Active",
  };

  return labels[normalized] || "Available";
}

function normalizeStatus(value) {
  return String(value || "Pending").trim().toLowerCase();
}

function isActiveRouteStatus(status) {
  return (
    status === "pending" || status === "scheduled" || status === "in progress"
  );
}