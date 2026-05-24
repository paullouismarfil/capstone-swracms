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
  Truck,
  ShieldCheck,
} from "lucide-react";

function getPageTitle(activeSection) {
  const titles = {
    dashboard: "Collection Staff Dashboard",
    assigned: "Assigned Pickup Requests",
    status: "Update Collection Status",
    notifications: "Notifications",
    recording: "Waste Recording",
    history: "Collection History",
  };

  return titles[activeSection] || "Collection Staff Dashboard";
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
      "Encode actual waste collected after the MENRO garbage truck completes pickup.",
    history: "Review previously encoded waste collection records.",
  };

  return subtitles[activeSection] || "";
}

export default function CollectorHeader({
  activeSection,
  searchTerm = "",
  setSearchTerm,
  showSearch = false,
  showBell = false,
  collectorName = "Collection Staff",
  collectorEmail = "",
  onLogout,
  onChangePassword,
}) {
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);

  function handleOpenProfile() {
    setOpenProfileMenu(false);
    setOpenProfileModal(true);
  }

  return (
    <>
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
          {showSearch && (
            <div className="hidden sm:flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-sm border">
              <Search size={18} className="text-gray-400" />

              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm?.(e.target.value)}
                className="outline-none text-sm bg-transparent w-40"
              />
            </div>
          )}

          {showBell && <NotificationBell role="collector" />}

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenProfileMenu((prev) => !prev)}
              className="flex items-center gap-3 bg-white border shadow-sm px-3 py-2 rounded-2xl hover:bg-gray-50 transition"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-sm font-bold">
                {getInitials(collectorName)}
              </div>

              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-gray-900 max-w-[160px] truncate">
                  {collectorName || "Collection Staff"}
                </p>

                <p className="text-xs text-gray-500 max-w-[180px] truncate">
                  {collectorEmail || "MENRO Collection Team"}
                </p>
              </div>

              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {openProfileMenu && (
              <div className="absolute right-0 mt-3 w-72 bg-white border rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="p-4 border-b">
                  <p className="text-sm font-bold text-gray-900">
                    {collectorName || "Collection Staff"}
                  </p>

                  <p className="text-sm text-gray-500 truncate">
                    {collectorEmail || "No email found"}
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
      </header>

      {openProfileModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">My Profile</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Collection staff account information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpenProfileModal(false)}
                className="w-10 h-10 rounded-2xl border flex items-center justify-center hover:bg-gray-50 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xl font-bold">
                  {getInitials(collectorName)}
                </div>

                <div>
                  <p className="text-lg font-bold text-gray-900">
                    {collectorName || "Collection Staff"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {collectorEmail || "No email found"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <ProfileRow
                  icon={<User size={18} />}
                  label="Name"
                  value={collectorName || "Collection Staff"}
                />

                <ProfileRow
                  icon={<Mail size={18} />}
                  label="Email Address"
                  value={collectorEmail || "No email found"}
                />

                <ProfileRow
                  icon={<Truck size={18} />}
                  label="Team"
                  value="MENRO Collection Team"
                />

                <ProfileRow
                  icon={<ShieldCheck size={18} />}
                  label="Role"
                  value="Collection Staff"
                />
              </div>

              <div className="mt-6 bg-green-50 border border-green-100 rounded-2xl p-4">
                <p className="text-sm font-semibold text-green-800">
                  Account Access
                </p>

                <p className="text-xs text-green-700 mt-1">
                  This account can view assigned pickup requests, update
                  collection status, record actual collected waste, and review
                  collection history.
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
    <div className="flex items-center justify-between gap-4 border rounded-2xl p-4 bg-gray-50">
      <div className="flex items-center gap-3 text-gray-600">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>

      <span className="text-sm font-bold text-gray-900 text-right">
        {value}
      </span>
    </div>
  );
}

function getInitials(name) {
  if (!name) return "CS";

  return String(name)
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}