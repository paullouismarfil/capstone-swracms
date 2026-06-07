import { useEffect, useMemo, useState } from "react";
import StatusBadge from "./StatusBadge";
import { formatDate, formatKg } from "./helpers";
import { AlertTriangle, Truck } from "lucide-react";
import { supabase } from "../../lib/supabase";

const DEFAULT_TRUCKS = [
  {
    id: "truck_1",
    truckCode: "truck_1",
    name: "Truck 1",
    label: "Recyclable Waste Truck",
    assignedWaste: "Plastic, Metal, Glass, Paper, Cardboard, Recyclable Waste",
    shortLabel: "Recyclable",
    status: "available",
    color: "#15803d",
  },
  {
    id: "truck_2",
    truckCode: "truck_2",
    name: "Truck 2",
    label: "Biodegradable Waste Truck",
    assignedWaste: "Food Waste, Leaves, Fruit Peels, Vegetable Scraps",
    shortLabel: "Biodegradable",
    status: "available",
    color: "#ca8a04",
  },
  {
    id: "truck_3",
    truckCode: "truck_3",
    name: "Truck 3",
    label: "Residual / Non-Biodegradable Truck",
    assignedWaste: "Residual Waste, Wrappers, Sachets, Non-Recyclable Plastics",
    shortLabel: "Residual",
    status: "available",
    color: "#2563eb",
  },
  {
    id: "truck_4",
    truckCode: "truck_4",
    name: "Truck 4",
    label: "Backup / Special Collection Truck",
    assignedWaste: "Backup, Overflow, Special, Emergency, or Unclassified Waste",
    shortLabel: "Backup",
    status: "available",
    color: "#dc2626",
  },
];

const TRUCK_STATUS_OPTIONS = [
  "available",
  "on_route",
  "under_maintenance",
  "unavailable",
  "backup_active",
];

export default function TrackRequestsTable({ requests, loading, full }) {
  const [collectionTrucks, setCollectionTrucks] = useState(DEFAULT_TRUCKS);

  useEffect(() => {
    fetchCollectionTrucks();
  }, []);

  async function fetchCollectionTrucks() {
    const { data, error } = await supabase
      .from("collection_trucks")
      .select("*")
      .order("truck_code", { ascending: true });

    if (error) {
      console.error("Collection trucks fetch error:", error);
      setCollectionTrucks(DEFAULT_TRUCKS);
      return;
    }

    setCollectionTrucks(mergeTruckData(data || []));
  }

  const trucksById = useMemo(() => {
    return collectionTrucks.reduce((map, truck) => {
      map[truck.id] = truck;
      return map;
    }, {});
  }, [collectionTrucks]);

  const trackedRequests = useMemo(() => {
    return assignRequestsToEffectiveTrucks(requests, trucksById);
  }, [requests, trucksById]);

  return (
    <div
      className={`${
        full ? "" : "xl:col-span-2"
      } bg-white rounded-3xl shadow-sm border overflow-hidden`}
    >
      <div className="p-6 border-b">
        <h3 className="text-xl font-bold">Track Collection Requests</h3>
        <p className="text-sm text-gray-500">
          Monitor submitted pickup requests, assigned truck, and collection
          progress.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1150px]">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="p-4 text-left">Request ID</th>
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">Collection Point</th>
              <th className="p-4 text-left">Waste Type</th>
              <th className="p-4 text-left">Estimated</th>
              <th className="p-4 text-left">Route</th>
              <th className="p-4 text-left">Assigned Truck</th>
              <th className="p-4 text-left">Photos</th>
              <th className="p-4 text-left">Date Submitted</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="10">
                  Loading requests...
                </td>
              </tr>
            )}

            {!loading && trackedRequests.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="10">
                  No collection requests yet.
                </td>
              </tr>
            )}

            {!loading &&
              trackedRequests.map((request) => {
                const photos = request.image_urls || [];

                return (
                  <tr key={request.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-semibold text-green-700">
                      CR-{String(request.id).padStart(3, "0")}
                    </td>

                    <td className="p-4">{request.request_title}</td>

                    <td className="p-4 text-gray-600">
                      {request.collection_point}
                    </td>

                    <td className="p-4">{request.waste_type}</td>

                    <td className="p-4 font-semibold">
                      {formatKg(request.estimated_weight)}
                    </td>

                    <td className="p-4 text-gray-600">
                      {request.schedule_group || "N/A"}
                    </td>

                    <td className="p-4">
                      <AssignedTruckDisplay request={request} />
                    </td>

                    <td className="p-4">
                      {photos.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {photos.slice(0, 3).map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-green-700 font-semibold text-sm"
                            >
                              Photo {index + 1}
                            </a>
                          ))}

                          {photos.length > 3 && (
                            <span className="text-gray-500 text-sm">
                              +{photos.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : request.image_url ? (
                        <a
                          href={request.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-green-700 font-semibold text-sm"
                        >
                          View Photo
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">No photo</span>
                      )}
                    </td>

                    <td className="p-4 text-gray-500">
                      {formatDate(request.created_at)}
                    </td>

                    <td className="p-4">
                      <div className="space-y-2">
                        <StatusBadge status={request.status} />

                        {request.needsReschedule && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            <AlertTriangle size={13} />
                            Needs Reschedule
                          </span>
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

function AssignedTruckDisplay({ request }) {
  if (request.needsReschedule) {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
          <AlertTriangle size={13} />
          Needs Reschedule
        </span>

        <p className="max-w-[240px] text-[11px] text-red-600">
          {request.rescheduleReason ||
            "MENRO will assign a new collection schedule or available truck."}
        </p>
      </div>
    );
  }

  if (!request.assignedTruck) {
    return <span className="text-sm text-gray-400">Not assigned</span>;
  }

  return (
    <div className="space-y-1">
      <span
        className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white"
        style={{ backgroundColor: request.assignedTruck.color || "#15803d" }}
      >
        <Truck size={13} />
        {request.assignedTruck.name} - {request.assignedTruck.shortLabel}
      </span>

      {request.isReassignedToBackup && (
        <p className="max-w-[240px] text-[11px] font-semibold text-red-600">
          Reassigned from {request.originalAssignedTruck?.name || "main truck"}{" "}
          because the main truck is unavailable.
        </p>
      )}

      <p className="max-w-[240px] text-[11px] text-gray-500">
        {request.assignedTruck.label}
      </p>
    </div>
  );
}

function mergeTruckData(databaseTrucks) {
  return DEFAULT_TRUCKS.map((defaultTruck) => {
    const foundTruck = databaseTrucks.find(
      (truck) => truck.truck_code === defaultTruck.truckCode
    );

    if (!foundTruck) return defaultTruck;

    return {
      ...defaultTruck,
      name: foundTruck.truck_name || defaultTruck.name,
      assignedWaste: foundTruck.assigned_waste || defaultTruck.assignedWaste,
      status: normalizeTruckStatus(foundTruck.status),
      updatedAt: foundTruck.updated_at,
    };
  });
}

function assignRequestsToEffectiveTrucks(requests, trucksById = {}) {
  const basicAssignments = requests.map((request) => {
    const originalAssignedTruck = getAssignedTruck(request.waste_type, trucksById);

    return {
      ...request,
      originalAssignedTruck,
      assignedTruck: originalAssignedTruck,
      isReassignedToBackup: false,
      needsReschedule: false,
      rescheduleReason: "",
    };
  });

  const backupTruck = trucksById.truck_4 || DEFAULT_TRUCKS[3];

  const unavailableMainTruckIds = ["truck_1", "truck_2", "truck_3"].filter(
    (truckId) => {
      const truck = trucksById[truckId];

      if (!truck || !isTruckUnavailableForRoute(truck.status)) {
        return false;
      }

      return basicAssignments.some(
        (request) =>
          request.originalAssignedTruck.id === truckId &&
          isActiveRouteStatus(normalizeStatus(request.status))
      );
    }
  );

  const backupCanBeUsed =
    backupTruck &&
    !isTruckUnavailableForRoute(backupTruck.status) &&
    unavailableMainTruckIds.length > 0;

  const truckIdAllowedToUseBackup = backupCanBeUsed
    ? unavailableMainTruckIds[0]
    : null;

  return basicAssignments.map((request) => {
    const originalTruck = request.originalAssignedTruck;

    if (
      originalTruck.id !== "truck_4" &&
      isTruckUnavailableForRoute(originalTruck.status)
    ) {
      if (
        backupCanBeUsed &&
        originalTruck.id === truckIdAllowedToUseBackup
      ) {
        return {
          ...request,
          assignedTruck: {
            ...backupTruck,
            status:
              normalizeTruckStatus(backupTruck.status) === "available"
                ? "backup_active"
                : backupTruck.status,
          },
          isReassignedToBackup: true,
          needsReschedule: false,
          rescheduleReason: "",
        };
      }

      return {
        ...request,
        assignedTruck: originalTruck,
        isReassignedToBackup: false,
        needsReschedule: true,
        rescheduleReason: backupCanBeUsed
          ? `${originalTruck.name} is unavailable and Truck 4 is already assigned as backup to another route. Please wait for MENRO to reschedule this collection.`
          : `${originalTruck.name} is unavailable and no backup truck is currently available. Please wait for MENRO to reschedule this collection.`,
      };
    }

    return request;
  });
}

function getAssignedTruck(wasteType, trucksById = {}) {
  const waste = String(wasteType || "").toLowerCase();

  if (
    waste.includes("recyclable") ||
    waste.includes("plastic") ||
    waste.includes("metal") ||
    waste.includes("glass") ||
    waste.includes("paper") ||
    waste.includes("cardboard") ||
    waste.includes("carton") ||
    waste.includes("bote") ||
    waste.includes("lata")
  ) {
    return trucksById.truck_1 || DEFAULT_TRUCKS[0];
  }

  if (
    waste.includes("biodegradable") ||
    waste.includes("bio") ||
    waste.includes("food") ||
    waste.includes("leaves") ||
    waste.includes("leaf") ||
    waste.includes("dahon") ||
    waste.includes("nabubulok") ||
    waste.includes("fruit") ||
    waste.includes("vegetable")
  ) {
    return trucksById.truck_2 || DEFAULT_TRUCKS[1];
  }

  if (
    waste.includes("residual") ||
    waste.includes("non-biodegradable") ||
    waste.includes("non biodegradable") ||
    waste.includes("hindi nabubulok") ||
    waste.includes("mixed") ||
    waste.includes("wrapper") ||
    waste.includes("sachet") ||
    waste.includes("non-recyclable") ||
    waste.includes("non recyclable")
  ) {
    return trucksById.truck_3 || DEFAULT_TRUCKS[2];
  }

  return trucksById.truck_4 || DEFAULT_TRUCKS[3];
}

function isTruckUnavailableForRoute(status) {
  const normalized = normalizeTruckStatus(status);

  return normalized === "under_maintenance" || normalized === "unavailable";
}

function normalizeTruckStatus(value) {
  const status = String(value || "available").trim().toLowerCase();

  if (TRUCK_STATUS_OPTIONS.includes(status)) {
    return status;
  }

  return "available";
}

function normalizeStatus(value) {
  return String(value || "Pending").trim().toLowerCase();
}

function isActiveRouteStatus(status) {
  return (
    status === "pending" || status === "scheduled" || status === "in progress"
  );
}