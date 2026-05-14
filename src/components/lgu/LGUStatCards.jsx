import {
  FileText,
  CalendarDays,
  Clock,
  Scale,
  Route,
} from "lucide-react";

export default function LGUStatCards({
  totalReports,
  pendingRequests,
  scheduledRequests,
  totalWasteKg,
  activeRoutes,
}) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-8">
      <StatCard
        title="Total Requests"
        value={totalReports}
        note="Submitted barangay requests"
        icon={<FileText size={26} />}
        color="green"
      />

      <StatCard
        title="Pending Requests"
        value={pendingRequests}
        note="Needs LGU validation"
        icon={<Clock size={26} />}
        color="orange"
      />

      <StatCard
        title="Scheduled Pickup"
        value={scheduledRequests}
        note="Assigned to route schedule"
        icon={<CalendarDays size={26} />}
        color="blue"
      />

      <StatCard
        title="Total Waste"
        value={`${totalWasteKg} kg`}
        note="Actual recorded waste"
        icon={<Scale size={26} />}
        color="green"
      />

      <StatCard
        title="Active Routes"
        value={activeRoutes}
        note="MENRO routing groups"
        icon={<Route size={26} />}
        color="blue"
      />
    </section>
  );
}

function StatCard({ title, value, note, icon, color }) {
  const styles = {
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-5">
        <div
          className={`w-13 h-13 rounded-2xl ${styles[color]} flex items-center justify-center p-3`}
        >
          {icon}
        </div>

        <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500">
          Live
        </span>
      </div>

      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-3xl font-bold mt-1">{value}</h3>
      <p className="text-sm text-gray-400 mt-2">{note}</p>
    </div>
  );
}