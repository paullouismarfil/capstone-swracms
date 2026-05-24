import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Trophy,
  Bell,
  Recycle,
  ClipboardList,
  X,
} from "lucide-react";

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition ${
        active ? "bg-green-600 shadow-lg" : "text-green-100 hover:bg-green-900"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-sm font-medium truncate">{label}</span>
    </button>
  );
}

export default function BarangaySidebar({
  activeSection,
  setActiveSection,
  barangay,
  mobileOpen = false,
  onCloseMobile,
}) {
  function handleNavigate(section) {
    setActiveSection(section);
    onCloseMobile?.();
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto
        w-72 max-w-[85vw] h-screen bg-green-950 text-white flex flex-col p-5 sm:p-6
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      >
        <div className="flex items-center justify-between gap-3 mb-8 lg:mb-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-green-700 flex items-center justify-center shrink-0">
              <Recycle size={26} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                SWRaCMS
              </h1>
              <p className="text-xs text-green-200 truncate">
                Barangay User Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden w-10 h-10 rounded-xl bg-green-900 flex items-center justify-center hover:bg-green-800"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto pr-1">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
            active={activeSection === "dashboard"}
            onClick={() => handleNavigate("dashboard")}
          />

          <SidebarItem
            icon={<FileText size={20} />}
            label="Submit Request"
            active={activeSection === "submit"}
            onClick={() => handleNavigate("submit")}
          />

          <SidebarItem
            icon={<ClipboardList size={20} />}
            label="Track Requests"
            active={activeSection === "track"}
            onClick={() => handleNavigate("track")}
          />

          <SidebarItem
            icon={<Bell size={20} />}
            label="Notifications"
            active={activeSection === "notifications"}
            onClick={() => handleNavigate("notifications")}
          />

          <SidebarItem
            icon={<CalendarDays size={20} />}
            label="Collection Schedule"
            active={activeSection === "schedule"}
            onClick={() => handleNavigate("schedule")}
          />

          <SidebarItem
            icon={<Trophy size={20} />}
            label="Leaderboard"
            active={activeSection === "leaderboard"}
            onClick={() => handleNavigate("leaderboard")}
          />
        </nav>

        <div className="bg-green-900 rounded-2xl p-4 mt-4 mb-1">
          <p className="text-sm font-semibold">Barangay Account</p>
          <p className="text-xs text-green-200 mt-1 break-words">
            {barangay || "Loading barangay..."}
          </p>
        </div>
      </aside>
    </>
  );
}