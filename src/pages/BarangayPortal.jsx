import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { findBarangaySchedule } from "../data/collectionSchedule";
import { searchCollectionRequests } from "../utils/searchHelpers";
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

export default function BarangayPortal() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const barangaySchedule = findBarangaySchedule(profile?.barangay);
  const searchedRequests = searchCollectionRequests(requests, searchTerm);

  useEffect(() => {
    loadProfileAndRequests();
  }, []);

  async function loadProfileAndRequests() {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      window.location.href = "/";
      return;
    }

    setUserEmail(user.email || "");

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !profileData) {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      alert("This account is not registered in the system.");
      window.location.href = "/";
      return;
    }

    if (profileData.role !== "barangay_user") {
      await supabase.auth.signOut();
      localStorage.removeItem("pendingRole");
      alert("Access denied. This account is not allowed to open Barangay Portal.");
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

    setProfile(profileData);
    fetchRequests(profileData.barangay);
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
    <div className="min-h-screen bg-[#f4f7f3] flex text-gray-900">
      <div className="sticky top-0 h-screen self-start overflow-y-auto bg-green-950">
        <BarangaySidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          barangay={profile?.barangay}
        />
      </div>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
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
        />

        {activeSection === "dashboard" && (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
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

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <BarangayScheduleCard
                schedule={barangaySchedule}
                barangay={profile?.barangay}
              />

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
    </div>
  );
}