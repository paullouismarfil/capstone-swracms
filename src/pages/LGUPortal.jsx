import { useEffect, useMemo, useState } from "react";
import LGUSidebar from "../components/lgu/LGUSidebar";
import ReportsTable from "../components/lgu/ReportsTable";
import NotificationsPage from "../components/NotificationsPage";
import LGUTopHeader from "../components/lgu/LGUTopHeader";
import LGUScheduleSection from "../components/lgu/LGUScheduleSection";
import LGUStatCards from "../components/lgu/LGUStatCards";
import LGULeaderboardSection from "../components/lgu/LGULeaderboardSection";
import LGUUsersSection from "../components/lgu/LGUUsersSection";
import RequestDetailsModal from "../components/lgu/RequestDetailsModal";
import CollectionMap from "../components/lgu/CollectionMap";
import MonthlyPrintableReport from "../components/lgu/MonthlyPrintableReport";
import LGUAnalyticsSection, {
  LGUWasteCompositionCard,
  LGUAnalyticsSummaryCard,
} from "../components/lgu/LGUAnalyticsSection";

import { searchCollectionRequests } from "../utils/searchHelpers";
import { collectionSchedule } from "../data/collectionSchedule";
import { supabase } from "../lib/supabase";

export default function LGUPortal() {
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem("lguActiveSection") || "dashboard";
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState([]);
  const [wasteRecords, setWasteRecords] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [adminProfile, setAdminProfile] = useState(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    loadAdminProfile();
  }, []);

  useEffect(() => {
    localStorage.setItem("lguActiveSection", activeSection);
  }, [activeSection]);

  async function loadAdminProfile() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      window.location.href = "/";
      return;
    }

    const loginEmail = String(user.email || "").toLowerCase();
    setAdminEmail(loginEmail);

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", loginEmail)
      .maybeSingle();

    if (error || !profileData) {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      localStorage.removeItem("lguActiveSection");
      alert("This account is not registered in the system.");
      window.location.href = "/";
      return;
    }

    if (profileData.role !== "lgu_admin") {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      localStorage.removeItem("lguActiveSection");
      alert("Access denied. This account is not allowed to open MENRO Admin Portal.");
      window.location.href = "/";
      return;
    }

    if (profileData.status !== "active") {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      localStorage.removeItem("lguActiveSection");
      alert("Your account is not active. Please contact the MENRO Admin.");
      window.location.href = "/";
      return;
    }

    setAdminProfile(profileData);
    fetchRequests();
    fetchWasteRecords();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("pendingRole");
    localStorage.removeItem("lguActiveSection");
    window.location.href = "/";
  }

  async function handleChangePassword() {
    if (!adminEmail) {
      alert("No email found for this account.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(adminEmail, {
      redirectTo: window.location.origin,
    });

    if (error) {
      console.error(error);
      alert("Failed to send password reset email.");
      return;
    }

    alert("Password reset email sent to " + adminEmail);
  }

  async function fetchRequests() {
    setLoadingRequests(true);

    const { data, error } = await supabase
      .from("collection_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setRequests(data || []);
    setLoadingRequests(false);
  }

  async function fetchWasteRecords() {
    const { data, error } = await supabase
      .from("waste_records")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setWasteRecords(data || []);
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
        remarks: "Auto-recorded when request was marked as collected.",
      },
    ]);

    if (insertError) {
      console.error("Waste record insert error:", insertError);
      alert("Request was collected, but waste record failed to save.");
    }
  }

  async function updateRequestStatus(id, status) {
    const requestData = requests.find((r) => r.id === id);

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
      .update({
        status,
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Update request status error:", error);
      alert("Failed to update request status.");
      return;
    }

    if (requestData.submitted_by) {
      await supabase.from("notifications").insert([
        {
          user_id: requestData.submitted_by,
          title: `Request ${status}`,
          message: `Your waste collection request has been marked as "${status}" by MENRO.`,
          type: "status_update",
          is_read: false,
        },
      ]);
    }

    if (status === "Scheduled") {
      await supabase.from("notifications").insert([
        {
          role: "collector",
          title: "New Pickup Schedule",
          message: `${requestData?.barangay || "Barangay"
            } request is now scheduled for collection.`,
          type: "collection_schedule",
          is_read: false,
        },
      ]);
    }

    if (status === "Collected") {
      await supabase.from("notifications").insert([
        {
          role: "lgu_admin",
          title: "Collection Completed",
          message: `${requestData?.barangay || "Barangay"
            } request has been marked as collected.`,
          type: "collection_complete",
          is_read: false,
        },
      ]);

      await autoRecordWasteIfNeeded(requestData);
    }

    fetchRequests();
    fetchWasteRecords();
  }

  const totalReports = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "Pending").length;
  const scheduledRequests = requests.filter(
    (r) => r.status === "Scheduled"
  ).length;

  const analytics = useMemo(
    () => calculateWasteAnalytics(wasteRecords),
    [wasteRecords]
  );

  const schedules = collectionSchedule;
  const searchedRequests = searchCollectionRequests(requests, searchTerm);

  const adminName =
    adminProfile?.full_name ||
    adminProfile?.name ||
    adminProfile?.username ||
    "MENRO Admin";

  const adminAvatar = adminProfile?.avatar_url || "";

  return (
    <div className="min-h-screen bg-[#f4f7f3] text-gray-900 lg:flex">
      <LGUSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <main className="min-w-0 flex-1 w-full p-3 sm:p-5 lg:p-8 overflow-x-hidden">
        <LGUTopHeader
          activeSection={activeSection}
          searchTerm={activeSection === "reports" ? searchTerm : ""}
          setSearchTerm={
            activeSection === "reports" ? setSearchTerm : undefined
          }
          showSearch={activeSection === "reports"}
          showBell={activeSection === "dashboard"}
          adminName={adminName}
          adminEmail={adminEmail}
          adminAvatar={adminAvatar}
          onLogout={handleLogout}
          onChangePassword={handleChangePassword}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {activeSection === "dashboard" && (
          <>
            <LGUStatCards
              totalReports={totalReports}
              pendingRequests={pendingRequests}
              scheduledRequests={scheduledRequests}
              totalWasteKg={analytics.totalKg}
            />

            <section className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6 mt-5 lg:mt-6">
              <div className="xl:col-span-8 space-y-4 lg:space-y-6 min-w-0">
                <ReportsTable
                  reports={searchedRequests.slice(0, 5)}
                  loading={loadingRequests}
                  onView={setSelectedRequest}
                  onStatusChange={updateRequestStatus}
                />

                <CollectionMap requests={requests} compact />
              </div>

              <div className="xl:col-span-4 space-y-4 lg:space-y-6 min-w-0">
                <LGUWasteCompositionCard analytics={analytics} />
                <LGUAnalyticsSummaryCard analytics={analytics} />
              </div>
            </section>

            <section className="mt-5 lg:mt-6">
              <LGUScheduleSection schedules={schedules} compact />
            </section>
          </>
        )}

        {activeSection === "reports" && (
          <ReportsTable
            reports={searchedRequests}
            loading={loadingRequests}
            full
            onView={setSelectedRequest}
            onStatusChange={updateRequestStatus}
          />
        )}

        {activeSection === "notifications" && (
          <NotificationsPage role="lgu_admin" />
        )}

        {activeSection === "schedule" && (
          <LGUScheduleSection schedules={schedules} />
        )}

        {activeSection === "analytics" && (
          <LGUAnalyticsSection analytics={analytics} records={wasteRecords} />
        )}

        {activeSection === "monthly_reports" && (
          <MonthlyPrintableReport records={wasteRecords} />
        )}

        {activeSection === "map" && <CollectionMap requests={requests} />}

        {activeSection === "leaderboard" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            <LGULeaderboardSection />

            <div className="bg-white rounded-3xl shadow-sm border p-5 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold">
                Ranking Criteria
              </h3>

              <p className="text-sm text-gray-500 mb-5">
                Barangay performance is based on useful recyclable and recoverable
                materials, not on the highest total garbage volume. The ranking rewards
                plastic, metal, glass, and recyclable waste that can still be reused,
                recycled, or sold.
              </p>

              <MiniBadge label="Plastic Collected" value="+3 pts per kg" />
              <MiniBadge label="Metal Collected" value="+5 pts per kg" />
              <MiniBadge label="Glass Collected" value="+2 pts per kg" />
              <MiniBadge label="Recyclable Waste" value="+3 pts per kg" />

              <MiniBadge
                label="Residual / Mixed / Biodegradable"
                value="0 pts"
              />

              <MiniBadge label="Missed Collection" value="-5 pts" />
              <MiniBadge label="Improper Segregation" value="-10 pts" />
            </div>
          </div>
        )}

        {activeSection === "users" && <LGUUsersSection />}

        {selectedRequest && (
          <RequestDetailsModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onStatusChange={async (id, status) => {
              await updateRequestStatus(id, status);
              setSelectedRequest(null);
            }}
          />
        )}
      </main>
    </div>
  );
}

function MiniBadge({ label, value }) {
  return (
    <div className="bg-gray-50 border rounded-2xl p-3 mb-3">
      <p className="text-gray-500">{label}</p>
      <p className="font-bold text-green-700">{value}</p>
    </div>
  );
}

function getPercent(value, total) {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
}

function parseKg(value) {
  if (!value) return 0;
  const number = String(value).replace(/[^0-9.]/g, "");
  return Number(number) || 0;
}

function splitWasteTypes(type) {
  if (!type) return ["Unspecified"];

  const types = String(type)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return types.length > 0 ? types : ["Unspecified"];
}

function isRecyclable(type) {
  const recyclableTypes = ["recyclable", "plastic", "metal", "glass"];

  const lower = String(type || "").toLowerCase();
  return recyclableTypes.some((keyword) => lower.includes(keyword));
}

function calculateWasteAnalytics(records) {
  const totalKg = records.reduce(
    (sum, record) => sum + parseKg(record.actual_weight),
    0
  );

  const wasteMap = {};
  const monthMap = {};
  const barangayMap = {};

  records.forEach((record) => {
    const kg = parseKg(record.actual_weight);
    const wasteTypes = splitWasteTypes(record.waste_type);
    const kgPerType = wasteTypes.length > 0 ? kg / wasteTypes.length : kg;
    const barangay = record.route_name || "Unspecified";

    wasteTypes.forEach((wasteType) => {
      wasteMap[wasteType] = (wasteMap[wasteType] || 0) + kgPerType;
    });

    barangayMap[barangay] = (barangayMap[barangay] || 0) + kg;

    const date = record.collected_date || record.created_at;
    const month = date
      ? new Date(date).toLocaleDateString("en-PH", {
        month: "long",
        year: "numeric",
      })
      : "Unspecified";

    monthMap[month] = (monthMap[month] || 0) + kg;
  });

  const wasteTypes = Object.entries(wasteMap)
    .map(([type, kg]) => ({
      type,
      kg: Number(kg.toFixed(2)),
      percent: getPercent(kg, totalKg),
    }))
    .sort((a, b) => b.kg - a.kg);

  const recyclableKg = wasteTypes
    .filter((item) => isRecyclable(item.type))
    .reduce((sum, item) => sum + item.kg, 0);

  const nonRecyclableKg = Math.max(totalKg - recyclableKg, 0);

  const monthlyMax = Math.max(...Object.values(monthMap), 0);
  const monthly = Object.entries(monthMap)
    .map(([month, kg]) => ({
      month,
      kg: Number(kg.toFixed(2)),
      percent: getPercent(kg, monthlyMax),
    }))
    .slice(-6);

  const barangayRanking = Object.entries(barangayMap)
    .map(([barangay, kg]) => ({
      barangay,
      kg: Number(kg.toFixed(2)),
    }))
    .sort((a, b) => b.kg - a.kg)
    .slice(0, 5);

  return {
    totalKg: Number(totalKg.toFixed(2)),
    recyclableKg: Number(recyclableKg.toFixed(2)),
    nonRecyclableKg: Number(nonRecyclableKg.toFixed(2)),
    recyclablePercent: getPercent(recyclableKg, totalKg),
    topWasteType: wasteTypes[0]?.type || "",
    wasteTypes,
    monthly,
    barangayRanking,
  };
}