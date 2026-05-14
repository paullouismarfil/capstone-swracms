import { Search } from "lucide-react";
import NotificationBell from "../NotificationBell";

export default function LGUTopHeader({
  activeSection,
  searchTerm,
  setSearchTerm,
}) {
  return (
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
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="outline-none text-sm bg-transparent w-44"
          />
        </div>

        <NotificationBell role="lgu_admin" />

        <div className="bg-green-700 text-white px-4 py-3 rounded-2xl shadow">
          MENRO Admin
        </div>
      </div>
    </header>
  );
}

function getPageTitle(activeSection) {
  const titles = {
    dashboard: "LGU Waste Management Dashboard",
    reports: "Waste Collection Reports",
    notifications: "Notifications",
    schedule: "Collection Schedule",
    analytics: "Waste Analytics",
    map: "Collection Map",
    leaderboard: "Barangay Leaderboard",
    users: "Manage Users",
  };

  return titles[activeSection] || "LGU Dashboard";
}

function getPageSubtitle(activeSection) {
  const subtitles = {
    dashboard:
      "Monitor municipal waste requests, collection performance, and real-time analytics.",

    reports:
      "Review and manage submitted waste collection requests from barangays.",

    notifications:
      "Track realtime alerts, request updates, and collection activities.",

    schedule:
      "Manage municipal garbage collection schedules and truck routes.",

    analytics:
      "Analyze waste trends, barangay performance, and collection statistics.",

    map:
      "View collection locations and assigned truck routes.",

    leaderboard:
      "Compare barangay waste performance and recycling participation.",

    users:
      "Manage barangay, collector, and administrator accounts.",
  };

  return subtitles[activeSection] || "";
}