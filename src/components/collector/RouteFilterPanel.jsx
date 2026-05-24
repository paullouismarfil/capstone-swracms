import { Route } from "lucide-react";

function RouteSummaryCard({ label, value }) {
  return (
    <div className="border rounded-2xl p-5 bg-gray-50">
      <p className="text-sm text-gray-500">{label}</p>
      <h3 className="text-xl font-bold text-green-700 mt-2">{value}</h3>
    </div>
  );
}

export default function RouteFilterPanel({
  selectedRoute,
  setSelectedRoute,
  routeOptions,
  filteredRequests,
}) {
  const scheduled = filteredRequests.filter((r) => r.status === "Scheduled").length;
  const inProgress = filteredRequests.filter((r) => r.status === "In Progress").length;

  return (
    <div className="bg-white rounded-3xl shadow-sm border p-6 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <Route className="text-green-700" size={26} />
            <h3 className="text-xl font-bold">MENRO Route Assignment</h3>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Filter scheduled pickup requests based on municipal collection routes.
          </p>
        </div>

        <div className="w-full lg:w-80">
          <label className="text-sm font-medium text-gray-600">
            Filter Collection Route
          </label>

          <select
            className="input-field"
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
          >
            {routeOptions.map((route) => (
              <option key={route}>{route}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <RouteSummaryCard label="Current Route" value={selectedRoute} />
        <RouteSummaryCard label="Filtered Requests" value={filteredRequests.length} />
        <RouteSummaryCard label="Scheduled Pickups" value={scheduled} />
        <RouteSummaryCard label="In Progress" value={inProgress} />
      </div>
    </div>
  );
}