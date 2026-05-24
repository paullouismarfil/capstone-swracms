import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Trophy,
  Bell,
  Recycle,
  ClipboardList,
} from "lucide-react";

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

export default function BarangaySidebar({
  activeSection,
  setActiveSection,
  barangay,
}) {
  return (
    <aside className="hidden lg:flex w-72 h-screen bg-green-950 text-white flex-col p-6">
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
        <SidebarItem
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          active={activeSection === "dashboard"}
          onClick={() => setActiveSection("dashboard")}
        />

        <SidebarItem
          icon={<FileText size={20} />}
          label="Submit Request"
          active={activeSection === "submit"}
          onClick={() => setActiveSection("submit")}
        />

        <SidebarItem
          icon={<ClipboardList size={20} />}
          label="Track Requests"
          active={activeSection === "track"}
          onClick={() => setActiveSection("track")}
        />

        <SidebarItem
          icon={<Bell size={20} />}
          label="Notifications"
          active={activeSection === "notifications"}
          onClick={() => setActiveSection("notifications")}
        />

        <SidebarItem
          icon={<CalendarDays size={20} />}
          label="Collection Schedule"
          active={activeSection === "schedule"}
          onClick={() => setActiveSection("schedule")}
        />

        <SidebarItem
          icon={<Trophy size={20} />}
          label="Leaderboard"
          active={activeSection === "leaderboard"}
          onClick={() => setActiveSection("leaderboard")}
        />
      </nav>

      <div className="bg-green-900 rounded-2xl p-4 mt-auto mb-2">
        <p className="text-sm font-semibold">Barangay Account</p>
        <p className="text-xs text-green-200 mt-1">
          {barangay || "Loading barangay..."}
        </p>
      </div>
    </aside>
  );
}