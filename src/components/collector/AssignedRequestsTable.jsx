import StatusBadge from "./StatusBadge";
import { formatKg } from "./helpers";
import { Lock, AlertTriangle, Truck } from "lucide-react";

export default function AssignedRequestsTable({
  requests,
  loading,
  full,
  onStatusChange,
}) {
  return (
    <div
      className={`${
        full ? "" : "xl:col-span-2"
      } bg-white rounded-3xl shadow-sm border overflow-hidden`}
    >
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Assigned Pickup Requests</h3>
          <p className="text-sm text-gray-500">
            Live requests filtered by the collector&apos;s assigned truck.
          </p>
        </div>

        <button className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm">
          Truck Filter Active
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="p-4 text-left">Request ID</th>
              <th className="p-4 text-left">Barangay</th>
              <th className="p-4 text-left">Collection Point</th>
              <th className="p-4 text-left">Waste Type</th>
              <th className="p-4 text-left">Assigned Truck</th>
              <th className="p-4 text-left">Route Group</th>
              <th className="p-4 text-left">Allowed Waste</th>
              <th className="p-4 text-left">Estimated</th>
              <th className="p-4 text-left">Preferred Date</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="11">
                  Loading assigned requests...
                </td>
              </tr>
            )}

            {!loading && requests.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="11">
                  No scheduled collection requests for your assigned truck.
                </td>
              </tr>
            )}

            {!loading &&
              requests.map((task) => {
                const isFinalized =
                  task.status === "Collected" ||
                  task.status === "Improper Segregation";

                const needsReschedule = Boolean(task.needsReschedule);
                const assignedTruck = task.assignedTruck;
                const originalTruck = task.originalAssignedTruck;
                const isBackupRoute = Boolean(task.isReassignedToBackup);

                return (
                  <tr key={task.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-semibold text-green-700">
                      CR-{String(task.id).padStart(3, "0")}
                    </td>

                    <td className="p-4 font-semibold">{task.barangay}</td>

                    <td className="p-4 text-gray-600">
                      {task.collection_point || "N/A"}
                    </td>

                    <td className="p-4">{task.waste_type || "Unspecified"}</td>

                    <td className="p-4">
                      {needsReschedule ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            <AlertTriangle size={13} />
                            Needs Reschedule
                          </span>

                          <p className="max-w-[230px] text-[11px] text-red-600">
                            {task.rescheduleReason ||
                              "This route needs LGU/MENRO rescheduling."}
                          </p>
                        </div>
                      ) : assignedTruck ? (
                        <div className="space-y-1">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white"
                            style={{
                              backgroundColor:
                                assignedTruck.color || "#15803d",
                            }}
                          >
                            <Truck size={13} />
                            {assignedTruck.name} -{" "}
                            {assignedTruck.shortLabel || "Assigned"}
                          </span>

                          {isBackupRoute && (
                            <p className="max-w-[230px] text-[11px] font-semibold text-red-600">
                              Backup route from{" "}
                              {originalTruck?.name || "main truck"}.
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        {task.schedule_group || "N/A"}
                      </span>
                    </td>

                    <td className="p-4 text-gray-600">
                      {task.allowed_waste_category || "N/A"}
                    </td>

                    <td className="p-4 font-semibold">
                      {formatKg(task.estimated_weight)}
                    </td>

                    <td className="p-4 text-gray-500">
                      {task.preferred_pickup_date || "No date"}
                    </td>

                    <td className="p-4">
                      <StatusBadge status={task.status} />
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2 flex-wrap items-center">
                        {needsReschedule ? (
                          <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-sm">
                            <AlertTriangle size={14} />
                            Waiting for MENRO
                          </span>
                        ) : isFinalized ? (
                          <span className="inline-flex items-center gap-1 text-gray-500 font-semibold text-sm">
                            <Lock size={14} />
                            Finalized
                          </span>
                        ) : (
                          <>
                            {task.status === "Scheduled" && (
                              <button
                                onClick={() =>
                                  onStatusChange(task.id, "In Progress")
                                }
                                className="text-blue-700 font-semibold text-sm"
                              >
                                Start
                              </button>
                            )}

                            {task.status === "In Progress" && (
                              <button
                                onClick={() =>
                                  onStatusChange(task.id, "Collected")
                                }
                                className="text-green-700 font-semibold text-sm"
                              >
                                Mark Collected
                              </button>
                            )}

                            {task.status === "In Progress" && (
                              <button
                                onClick={() =>
                                  onStatusChange(
                                    task.id,
                                    "Improper Segregation"
                                  )
                                }
                                className="text-orange-600 font-semibold text-sm"
                              >
                                Improper Segregation
                              </button>
                            )}

                            {task.status !== "Missed" && (
                              <button
                                onClick={() =>
                                  onStatusChange(task.id, "Missed")
                                }
                                className="text-red-600 font-semibold text-sm"
                              >
                                Missed
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}