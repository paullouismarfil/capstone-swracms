import { useEffect, useState } from "react";
import NotificationsPage from "../components/NotificationsPage";
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

export default function CollectionStaffPortal() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("All Routes");

  const [collectorProfile, setCollectorProfile] = useState(null);
  const [collectorEmail, setCollectorEmail] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    loadCollectorProfile();
  }, []);

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
      alert("This account is not registered in the system.");
      window.location.href = "/";
      return;
    }

    if (profileData.role !== "collection_staff") {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      alert("Access denied. This account is not allowed to open Collector Portal.");
      window.location.href = "/";
      return;
    }

    if (profileData.status !== "active") {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      alert("Your account is not active. Please contact the LGU Admin.");
      window.location.href = "/";
      return;
    }

    setCollectorProfile(profileData);
    fetchAssignedRequests();
    fetchWasteRecords();
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
    const requestData = assignedRequests.find((item) => item.id === id);

    if (!requestData) {
      alert("Request not found.");
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
      .eq("id", id);

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

  const routeOptions = [
    "All Routes",
    ...new Set(assignedRequests.map((r) => r.schedule_group).filter(Boolean)),
  ];

  const filteredRequests =
    selectedRoute === "All Routes"
      ? assignedRequests
      : assignedRequests.filter((r) => r.schedule_group === selectedRoute);

  const searchedRequests = searchCollectionRequests(filteredRequests, searchTerm);
  const searchedHistoryRecords = searchWasteRecords(historyRecords, searchTerm);

  const inProgressCount = searchedRequests.filter(
    (r) => r.status === "In Progress"
  ).length;

  const scheduledCount = searchedRequests.filter(
    (r) => r.status === "Scheduled"
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
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-6 lg:mb-8">
              <CollectorStatCard
                title="Assigned Pickups"
                value={searchedRequests.length}
                note="Filtered scheduled requests"
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