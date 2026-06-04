import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { findBarangaySchedule } from "../data/collectionSchedule";
import EcoBot from "../components/chatbot/EcoBot";
import { searchCollectionRequests } from "../utils/searchHelpers";
import { createBarangayScheduleReminder } from "../utils/scheduleReminderHelper";
import NotificationsPage from "../components/NotificationsPage";
import BarangaySidebar from "../components/barangay/BarangaySidebar";
import BarangayHeader from "../components/barangay/BarangayHeader";
import BarangayStatCard from "../components/barangay/BarangayStatCard";
import BarangayScheduleCard from "../components/barangay/BarangayScheduleCard";
import BarangaySchedulePage from "../components/barangay/BarangaySchedulePage";
import SubmitRequestForm from "../components/barangay/SubmitRequestForm";
import TrackRequestsTable from "../components/barangay/TrackRequestsTable";
import LeaderboardSection from "../components/barangay/LeaderboardSection";
import LeaderboardCard from "../components/barangay/LeaderboardCard";
import OverviewCard from "../components/barangay/OverviewCard";

import {
  FileText,
  CalendarDays,
  Clock,
  CheckCircle,
} from "lucide-react";

const BARANGAY_ACTIVE_SECTION_KEY = "barangayActiveSection";

const VALID_BARANGAY_SECTIONS = [
  "dashboard",
  "submit",
  "track",
  "notifications",
  "schedule",
  "leaderboard",
];

function getSavedBarangaySection() {
  const savedSection = localStorage.getItem(BARANGAY_ACTIVE_SECTION_KEY);

  if (VALID_BARANGAY_SECTIONS.includes(savedSection)) {
    return savedSection;
  }

  return "dashboard";
}

export default function BarangayPortal() {
  const [activeSection, setActiveSection] = useState(getSavedBarangaySection);
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const barangaySchedule = findBarangaySchedule(profile?.barangay);
  const searchedRequests = searchCollectionRequests(requests, searchTerm);

  useEffect(() => {
    loadProfileAndRequests();
  }, []);

  useEffect(() => {
    localStorage.setItem(BARANGAY_ACTIVE_SECTION_KEY, activeSection);

    if (activeSection !== "track") {
      setSearchTerm("");
    }
  }, [activeSection]);

  async function loadProfileAndRequests() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      window.location.href = "/";
      return;
    }

    const loginEmail = String(user.email || "").toLowerCase();
    setUserEmail(loginEmail);

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", loginEmail)
      .maybeSingle();

    if (error || !profileData) {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      localStorage.removeItem(BARANGAY_ACTIVE_SECTION_KEY);
      alert("This account is not registered in the system.");
      window.location.href = "/";
      return;
    }

    if (profileData.role !== "barangay_user") {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      localStorage.removeItem(BARANGAY_ACTIVE_SECTION_KEY);
      alert("Access denied. This account is not allowed to open Barangay Portal.");
      window.location.href = "/";
      return;
    }

    if (profileData.status !== "active") {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      localStorage.removeItem(BARANGAY_ACTIVE_SECTION_KEY);
      alert("Your account is not active. Please contact the LGU Admin.");
      window.location.href = "/";
      return;
    }

    setProfile(profileData);
    fetchRequests(profileData.barangay);

    await createBarangayScheduleReminder(profileData);
  }

  async function fetchRequests(barangayName) {
    if (!barangayName) return;

    setLoadingRequests(true);

    const { data, error } = await supabase
      .from("collection_requests")
      .select("*")
      .eq("barangay", barangayName)
      .order("created_at", { ascending: false });

    if (!error) setRequests(data || []);
    setLoadingRequests(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("pendingRole");
    localStorage.removeItem(BARANGAY_ACTIVE_SECTION_KEY);
    window.location.href = "/";
  }

  async function handleChangePassword() {
    if (!userEmail) {
      alert("No email found for this account.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: window.location.origin,
    });

    if (error) {
      console.error(error);
      alert("Failed to send password reset email.");
      return;
    }

    alert("Password reset email sent to " + userEmail);
  }

  const pendingCount = requests.filter((r) => r.status === "Pending").length;
  const scheduledCount = requests.filter((r) => r.status === "Scheduled").length;
  const collectedCount = requests.filter((r) => r.status === "Collected").length;

  const showSearch = activeSection === "track";
  const showBell = activeSection === "dashboard";

  const userName =
    profile?.full_name ||
    profile?.name ||
    profile?.username ||
    "Barangay User";

  return (
    <div className="min-h-screen bg-[#f4f7f3] text-gray-900 lg:flex">
      <BarangaySidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        barangay={profile?.barangay}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <main className="min-w-0 flex-1 w-full p-3 sm:p-5 lg:p-8 overflow-x-hidden">
        <BarangayHeader
          activeSection={activeSection}
          searchTerm={showSearch ? searchTerm : ""}
          setSearchTerm={showSearch ? setSearchTerm : undefined}
          showSearch={showSearch}
          showBell={showBell}
          barangay={profile?.barangay}
          userId={profile?.id}
          userName={userName}
          userEmail={userEmail}
          onLogout={handleLogout}
          onChangePassword={handleChangePassword}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {activeSection === "dashboard" && (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-6 lg:mb-8">
              <BarangayStatCard
                title="Collection Requests"
                value={requests.length}
                note="Total submitted requests"
                icon={<FileText size={26} />}
                color="green"
              />

              <BarangayStatCard
                title="Pending Approval"
                value={pendingCount}
                note="Waiting for MENRO validation"
                icon={<Clock size={26} />}
                color="orange"
              />

              <BarangayStatCard
                title="Scheduled Pickup"
                value={scheduledCount}
                note="Assigned for collection"
                icon={<CalendarDays size={26} />}
                color="blue"
              />

              <BarangayStatCard
                title="Collected Requests"
                value={collectedCount}
                note="Successfully collected"
                icon={<CheckCircle size={26} />}
                color="green"
              />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
              <BarangayScheduleCard
                schedule={barangaySchedule}
                barangay={profile?.barangay}
              />

              <div className="xl:col-span-2 bg-white rounded-3xl shadow-sm border p-5 sm:p-6 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold">
                  Collection Point Overview
                </h3>

                <p className="text-sm text-gray-500 mb-5 sm:mb-6">
                  Summary of waste gathered at the barangay collection point.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
                  <OverviewCard title="Collection Point" value="Barangay Hall" />
                  <OverviewCard title="Total Requests" value={requests.length} />
                  <OverviewCard title="Pending" value={pendingCount} />
                  <OverviewCard title="Status" value="Active" />
                </div>
              </div>

              <LeaderboardCard />

              <TrackRequestsTable
                requests={searchedRequests.slice(0, 2)}
                loading={loadingRequests}
              />
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
          <TrackRequestsTable
            requests={searchedRequests}
            loading={loadingRequests}
            full
          />
        )}

        {activeSection === "notifications" && (
          <NotificationsPage userId={profile?.id} />
        )}

        {activeSection === "schedule" && (
          <BarangaySchedulePage
            schedule={barangaySchedule}
            barangay={profile?.barangay}
          />
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
      <EcoBot role="Barangay User" botName="Smart Assist" />
    </div>
  );
}