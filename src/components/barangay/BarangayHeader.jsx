import { useState } from "react";
import NotificationBell from "../NotificationBell";
import {
  Search,
  ChevronDown,
  User,
  KeyRound,
  LogOut,
  X,
  Mail,
  Home,
  ShieldCheck,
  Menu,
} from "lucide-react";

function getPageTitle(activeSection) {
  const titles = {
    dashboard: "Barangay Dashboard",
    submit: "Submit Collection Request",
    track: "Track Collection Requests",
    notifications: "Notifications",
    schedule: "Collection Schedule",
    leaderboard: "Barangay Leaderboard",
  };

  return titles[activeSection] || "Barangay Dashboard";
}

function getPageSubtitle(activeSection) {
  const subtitles = {
    dashboard:
      "Manage collection requests, monitor schedules, and coordinate with MENRO waste collection teams.",
    submit:
      "Request MENRO pickup once waste has been gathered at the barangay collection point.",
    track:
      "Monitor submitted pickup requests and their current collection status.",
    notifications:
      "View request updates, collection status, and MENRO announcements.",
    schedule:
      "View your assigned MENRO waste collection schedule.",
    leaderboard:
      "View barangay performance ranking and scoring criteria.",
  };

  return subtitles[activeSection] || "";
}

export default function BarangayHeader({
  activeSection,
  searchTerm = "",
  setSearchTerm,
  showSearch = false,
  showBell = false,
  barangay,
  userId,
  userName = "Barangay User",
  userEmail = "",
  onLogout,
  onChangePassword,
  onOpenMobileSidebar,
}) {
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);

  function handleOpenProfile() {
    setOpenProfileMenu(false);
    setOpenProfileModal(true);
  }

  return (
    <>
      <header className="mb-6 lg:mb-8">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <button
              type="button"
              onClick={onOpenMobileSidebar}
              className="lg:hidden w-11 h-11 rounded-2xl bg-white border shadow-sm flex items-center justify-center hover:bg-gray-50 shrink-0"
            >
              <Menu size={22} className="text-gray-700" />
            </button>

            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight break-words">
                {getPageTitle(activeSection)}
              </h2>

              <p className="text-sm sm:text-base text-gray-500 mt-1 leading-relaxed">
                {getPageSubtitle(activeSection)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {showBell && userId && <NotificationBell userId={userId} />}

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenProfileMenu((prev) => !prev)}
                className="flex items-center gap-2 sm:gap-3 bg-white border shadow-sm px-2 sm:px-3 py-2 rounded-2xl hover:bg-gray-50 transition"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-sm font-bold shrink-0">
                  {getInitials(userName || barangay)}
                </div>

                <div className="hidden md:block text-left">
                  <p className="text-sm font-bold text-gray-900 max-w-[160px] truncate">
                    {barangay || userName || "Barangay"}
                  </p>

                  <p className="text-xs text-gray-500 max-w-[180px] truncate">
                    {userEmail || "Barangay Account"}
                  </p>
                </div>

                <ChevronDown
                  size={16}
                  className="text-gray-500 hidden sm:block"
                />
              </button>

              {openProfileMenu && (
                <div className="absolute right-0 mt-3 w-72 max-w-[90vw] bg-white border rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b">
                    <p className="text-sm font-bold text-gray-900">
                      {barangay || userName || "Barangay User"}
                    </p>

                    <p className="text-sm text-gray-500 truncate">
                      {userEmail || "No email found"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenProfile}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition"
                  >
                    <User size={18} />
                    <span className="text-sm font-medium">My Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenProfileMenu(false);
                      onChangePassword?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition"
                  >
                    <KeyRound size={18} />
                    <span className="text-sm font-medium">Change Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOpenProfileMenu(false);
                      onLogout?.();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 hover:bg-red-50 transition border-t"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-semibold">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showSearch && (
          <div className="mt-4 w-full sm:max-w-md flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border">
            <Search size={18} className="text-gray-400 shrink-0" />

            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm?.(e.target.value)}
              className="outline-none text-sm bg-transparent w-full"
            />
          </div>
        )}
      </header>

      {openProfileModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 sm:p-6 border-b flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">My Profile</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Barangay account information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpenProfileModal(false)}
                className="w-10 h-10 rounded-2xl border flex items-center justify-center hover:bg-gray-50 transition shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-lg sm:text-xl font-bold shrink-0">
                  {getInitials(userName || barangay)}
                </div>

                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900 truncate">
                    {barangay || userName || "Barangay User"}
                  </p>

                  <p className="text-sm text-gray-500 truncate">
                    {userEmail || "No email found"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <ProfileRow
                  icon={<User size={18} />}
                  label="Name"
                  value={userName || "Barangay User"}
                />

                <ProfileRow
                  icon={<Mail size={18} />}
                  label="Email Address"
                  value={userEmail || "No email found"}
                />

                <ProfileRow
                  icon={<Home size={18} />}
                  label="Barangay"
                  value={barangay || "Loading barangay..."}
                />

                <ProfileRow
                  icon={<ShieldCheck size={18} />}
                  label="Role"
                  value="Barangay User"
                />
              </div>

              <div className="mt-6 bg-green-50 border border-green-100 rounded-2xl p-4">
                <p className="text-sm font-semibold text-green-800">
                  Account Access
                </p>

                <p className="text-xs text-green-700 mt-1 leading-relaxed">
                  This account can submit collection requests, track request
                  status, view schedules, and receive MENRO notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProfileRow({ icon, label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 border rounded-2xl p-4 bg-gray-50">
      <div className="flex items-center gap-3 text-gray-600">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>

      <span className="text-sm font-bold text-gray-900 sm:text-right break-words">
        {value}
      </span>
    </div>
  );
}

function getInitials(name) {
  if (!name) return "BU";

  return String(name)
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}