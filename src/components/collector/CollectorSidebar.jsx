import {
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  Bell,
  Scale,
  FileText,
  Truck,
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

export default function CollectorSidebar({
  activeSection,
  setActiveSection,
}) {
  return (
    <aside className="hidden lg:flex w-72 h-screen bg-green-950 text-white flex-col p-6">
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

      <div className="bg-green-900 rounded-2xl p-4 mt-auto mb-2">
        <p className="text-sm font-semibold">LGU Garbage Truck</p>
        <p className="text-xs text-green-200 mt-1">
          One MENRO truck follows the assigned municipal route schedule.
        </p>
      </div>
    </aside>
  );
}