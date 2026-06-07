import { Fragment, useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
} from "react-leaflet";
import RescheduleRouteModal from "./RescheduleRouteModal";
import L from "leaflet";
import { supabase } from "../../lib/supabase";

const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const orangeIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const yellowIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const greyIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_TRUCKS = [
  {
    id: "truck_1",
    truckCode: "truck_1",
    name: "Truck 1",
    label: "Recyclable Waste Truck",
    assignedWaste: "Plastic, Metal, Glass, Paper, Cardboard, Recyclable Waste",
    shortLabel: "Recyclable",
    status: "available",
    remarks: "Assigned for recyclable materials.",
    color: "#15803d",
    bgClass: "bg-green-50",
    textClass: "text-green-700",
  },
  {
    id: "truck_2",
    truckCode: "truck_2",
    name: "Truck 2",
    label: "Biodegradable Waste Truck",
    assignedWaste: "Food Waste, Leaves, Fruit Peels, Vegetable Scraps",
    shortLabel: "Biodegradable",
    status: "available",
    remarks: "Assigned for biodegradable waste.",
    color: "#ca8a04",
    bgClass: "bg-yellow-50",
    textClass: "text-yellow-700",
  },
  {
    id: "truck_3",
    truckCode: "truck_3",
    name: "Truck 3",
    label: "Residual / Non-Biodegradable Truck",
    assignedWaste: "Residual Waste, Wrappers, Sachets, Non-Recyclable Plastics",
    shortLabel: "Residual",
    status: "available",
    remarks: "Assigned for residual and non-biodegradable waste.",
    color: "#2563eb",
    bgClass: "bg-blue-50",
    textClass: "text-blue-700",
  },
  {
    id: "truck_4",
    truckCode: "truck_4",
    name: "Truck 4",
    label: "Backup / Special Collection Truck",
    assignedWaste: "Backup, Overflow, Special, Emergency, or Unclassified Waste",
    shortLabel: "Backup",
    status: "available",
    remarks: "Backup truck for unavailable trucks or special collection.",
    color: "#dc2626",
    bgClass: "bg-red-50",
    textClass: "text-red-700",
  },
];

const TRUCK_STATUS_OPTIONS = [
  "available",
  "on_route",
  "under_maintenance",
  "unavailable",
  "backup_active",
];

const menroOffice = {
  barangay: "MENRO Office / Starting Point",
  position: [10.7903, 122.0176],
};

function createTruckIcon(truck) {
  return new L.DivIcon({
    html: `
      <div style="
        width: 48px;
        height: 48px;
        border-radius: 999px;
        background: ${truck.color};
        color: white;
        border: 3px solid white;
        box-shadow: 0 8px 20px rgba(0,0,0,0.25);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        line-height: 1;
      ">
        <div style="font-size: 21px;">🚛</div>
        <div style="font-size: 9px; font-weight: 700; margin-top: 1px;">
          ${truck.name.replace("Truck ", "T")}
        </div>
      </div>
    `,
    className: "",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

export default function CollectionMap({ requests = [] }) {
  const sibalomCenter = [10.7903, 122.0176];

  const [barangayLocations, setBarangayLocations] = useState([]);
  const [trucks, setTrucks] = useState(DEFAULT_TRUCKS);
  const [roadRoutesByTruck, setRoadRoutesByTruck] = useState({});
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [updatingTruck, setUpdatingTruck] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState(null);
  const [selectedRescheduleRequest, setSelectedRescheduleRequest] =
    useState(null);

  useEffect(() => {
    fetchBarangayLocations();
    fetchCollectionTrucks();
  }, []);

  async function fetchBarangayLocations() {
    const { data, error } = await supabase
      .from("barangay_locations")
      .select("*")
      .order("barangay", { ascending: true });

    if (error) {
      console.error("Barangay locations fetch error:", error);
      setBarangayLocations([]);
      return;
    }

    setBarangayLocations(data || []);
  }

  async function fetchCollectionTrucks() {
    const { data, error } = await supabase
      .from("collection_trucks")
      .select("*")
      .order("truck_code", { ascending: true });

    if (error) {
      console.error("Collection trucks fetch error:", error);
      setTrucks(DEFAULT_TRUCKS);
      return;
    }

    setTrucks(mergeTruckData(data || []));
  }

  async function updateTruckStatus(truck, newStatus) {
    if (!truck?.truckCode || updatingTruck) return;

    const confirmMessage = `Change ${truck.name} status to "${getTruckStatusLabel(
      newStatus
    )}"?`;

    if (!window.confirm(confirmMessage)) return;

    setUpdatingTruck(true);

    const { error } = await supabase
      .from("collection_trucks")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("truck_code", truck.truckCode);

    if (error) {
      console.error("Update truck status error:", error);
      alert(
        "Failed to update truck status. Please check Supabase update policy."
      );
      setUpdatingTruck(false);
      return;
    }

    await fetchCollectionTrucks();

    setSelectedTruck((prev) =>
      prev ? { ...prev, status: newStatus } : prev
    );

    setUpdatingTruck(false);
  }

  async function handleRescheduleSuccess() {
    await fetchCollectionTrucks();

    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }

  const trucksById = useMemo(() => {
    return trucks.reduce((map, truck) => {
      map[truck.id] = truck;
      return map;
    }, {});
  }, [trucks]);

  const currentBarangayRequests = getCurrentBarangayRequests(requests);

  const basicMapPoints = currentBarangayRequests
    .map((request) => {
      const foundLocation = findBarangayLocation(
        request.barangay,
        barangayLocations
      );

      if (!foundLocation?.latitude || !foundLocation?.longitude) {
        return null;
      }

      const status = normalizeStatus(request.status);
      const displayStatus = getDisplayStatus(status);

      const originalAssignedTruck = getAssignedTruck(
        request.waste_type,
        trucksById
      );

      return {
        id: request.id,
        barangay:
          request.barangay || foundLocation?.barangay || "Unknown Barangay",
        status,
        displayStatus,
        waste: request.waste_type || "Unspecified",
        originalAssignedTruck,
        assignedTruck: originalAssignedTruck,
        isReassignedToBackup: false,
        needsReschedule: false,
        rescheduleReason: "",
        weight:
          request.estimated_weight ||
          request.actual_weight ||
          request.weight ||
          request.quantity ||
          "N/A",
        collectionPoint: request.collection_point || "N/A",
        position: [
          Number(foundLocation.latitude),
          Number(foundLocation.longitude),
        ],
        statusUpdatedAt:
          request.status_updated_at || request.updated_at || request.created_at,
        zIndexOffset: getMarkerZIndex(status),
      };
    })
    .filter(Boolean);

  const backupTruck = trucksById.truck_4 || DEFAULT_TRUCKS[3];

  const unavailableMainTruckIds = ["truck_1", "truck_2", "truck_3"].filter(
    (truckId) => {
      const truck = trucksById[truckId];

      if (!truck || !isTruckUnavailableForRoute(truck.status)) {
        return false;
      }

      return basicMapPoints.some(
        (point) =>
          point.originalAssignedTruck.id === truckId &&
          isActiveRouteStatus(point.status)
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

  const mapPoints = basicMapPoints.map((point) => {
    const originalTruck = point.originalAssignedTruck;

    if (
      originalTruck.id !== "truck_4" &&
      isTruckUnavailableForRoute(originalTruck.status)
    ) {
      if (
        backupCanBeUsed &&
        originalTruck.id === truckIdAllowedToUseBackup
      ) {
        return {
          ...point,
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
        ...point,
        assignedTruck: originalTruck,
        isReassignedToBackup: false,
        needsReschedule: true,
        rescheduleReason: backupCanBeUsed
          ? `${originalTruck.name} is unavailable and Truck 4 is already assigned as backup to another route. This request needs rescheduling.`
          : `${originalTruck.name} is unavailable and no backup truck is currently available. This request needs rescheduling.`,
      };
    }

    return point;
  });

  const truckGroups = useMemo(() => {
    const groups = {};

    trucks.forEach((truck) => {
      groups[truck.id] = {
        truck,
        activePoints: [],
        allPoints: [],
        routeLinePositions: [],
        truckPoint: null,
      };
    });

    mapPoints.forEach((point) => {
      if (point.needsReschedule) return;

      const truckId = point.assignedTruck.id;

      if (!groups[truckId]) {
        groups[truckId] = {
          truck: point.assignedTruck,
          activePoints: [],
          allPoints: [],
          routeLinePositions: [],
          truckPoint: null,
        };
      }

      if (point.isReassignedToBackup && truckId === "truck_4") {
        groups[truckId].truck = {
          ...groups[truckId].truck,
          status: "backup_active",
        };
      }

      groups[truckId].allPoints.push(point);

      if (isActiveRouteStatus(point.status)) {
        groups[truckId].activePoints.push(point);
      }
    });

    Object.values(groups).forEach((group) => {
      group.activePoints = getSortedActiveRoutePoints(group.activePoints);
      group.routeLinePositions =
        group.activePoints.length > 0
          ? [
              menroOffice.position,
              ...group.activePoints.map((point) => point.position),
            ]
          : [];
      group.truckPoint = getTruckPoint(group.activePoints);
    });

    return groups;
  }, [JSON.stringify(mapPoints), JSON.stringify(trucks)]);

  const routeSignature = useMemo(() => {
    return JSON.stringify(
      Object.values(truckGroups).map((group) => ({
        truckId: group.truck.id,
        route: group.routeLinePositions,
      }))
    );
  }, [truckGroups]);

  useEffect(() => {
    fetchRoadRoutesForTrucks(truckGroups);
  }, [routeSignature]);

  async function fetchRoadRoutesForTrucks(groups) {
    try {
      setLoadingRoute(true);

      const newRoutes = {};

      const routePromises = Object.values(groups).map(async (group) => {
        const points = group.routeLinePositions;

        if (!points || points.length < 2) {
          newRoutes[group.truck.id] = [];
          return;
        }

        try {
          const coordinates = points
            .map(([lat, lng]) => `${lng},${lat}`)
            .join(";");

          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`
          );

          const data = await response.json();

          const routeCoordinates =
            data?.routes?.[0]?.geometry?.coordinates || [];

          if (
            !Array.isArray(routeCoordinates) ||
            routeCoordinates.length === 0
          ) {
            newRoutes[group.truck.id] = points;
            return;
          }

          newRoutes[group.truck.id] = routeCoordinates.map(([lng, lat]) => [
            lat,
            lng,
          ]);
        } catch (error) {
          console.error(`${group.truck.name} road route fetch error:`, error);
          newRoutes[group.truck.id] = points;
        }
      });

      await Promise.all(routePromises);
      setRoadRoutesByTruck(newRoutes);
    } finally {
      setLoadingRoute(false);
    }
  }

  const pendingCount = mapPoints.filter((p) => p.status === "pending").length;

  const scheduledCount = mapPoints.filter(
    (p) => p.status === "scheduled"
  ).length;

  const inProgressCount = mapPoints.filter(
    (p) => p.status === "in progress"
  ).length;

  const collectedCount = mapPoints.filter(
    (p) => p.status === "collected"
  ).length;

  const missedCount = mapPoints.filter((p) => p.status === "missed").length;

  const improperCount = mapPoints.filter(
    (p) => p.status === "improper segregation"
  ).length;

  const activeTruckCount = Object.values(truckGroups).filter(
    (group) => group.truckPoint
  ).length;

  const reschedulePoints = mapPoints.filter((point) => point.needsReschedule);
  const rescheduleCount = reschedulePoints.length;

  return (
    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold">
                Collection Monitoring Map
              </h3>

              <p className="text-gray-500 mt-1">
                Monitor barangay collection points, pickup requests, current
                status, truck availability, and assigned truck routes.
              </p>
            </div>

            <div className="rounded-2xl border bg-green-50 px-4 py-3">
              <p className="text-xs text-gray-500">Active Truck Routes</p>

              <p className="text-sm font-bold text-green-700">
                {activeTruckCount > 0
                  ? `${activeTruckCount} truck route${
                      activeTruckCount > 1 ? "s" : ""
                    } active`
                  : "No active truck route"}
              </p>

              {loadingRoute && (
                <p className="text-xs text-gray-500 mt-1">
                  Loading road routes...
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {trucks.map((truck) => {
              const group = truckGroups[truck.id];
              const truckPoint = group?.truckPoint;

              return (
                <TruckRouteCard
                  key={truck.id}
                  truck={group?.truck || truck}
                  truckPoint={truckPoint}
                  activeCount={group?.activePoints?.length || 0}
                  onClick={() => setSelectedTruck(group?.truck || truck)}
                />
              );
            })}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-gray-500">
              Tap a truck card to update its status. If Truck 1, 2, or 3 becomes
              unavailable or under maintenance, its route can be assigned to
              Truck 4 as backup.
            </p>

            {rescheduleCount > 0 && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-bold text-red-700">
                  {rescheduleCount} request{rescheduleCount > 1 ? "s" : ""} need
                  rescheduling
                </p>

                <p className="text-xs text-red-600 mt-1">
                  Truck 4 can only handle one backup route at a time. Other
                  affected routes must be rescheduled by LGU/MENRO.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-[650px] w-full relative">
        <MapContainer
          center={sibalomCenter}
          zoom={13}
          scrollWheelZoom={true}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {Object.values(truckGroups).map((group) => {
            const roadRoutePositions = roadRoutesByTruck[group.truck.id] || [];

            if (roadRoutePositions.length <= 1) return null;

            return (
              <Polyline
                key={`${group.truck.id}-route`}
                positions={roadRoutePositions}
                pathOptions={{
                  color: group.truck.color,
                  weight: 5,
                  opacity: 0.82,
                }}
              />
            );
          })}

          {activeTruckCount > 0 && (
            <Marker position={menroOffice.position} icon={greenIcon}>
              <Popup>
                <div className="space-y-1 min-w-[180px]">
                  <h4 className="font-bold text-green-700">
                    MENRO Starting Point
                  </h4>

                  <p className="text-sm text-gray-600">
                    This is the starting point of the collection routes.
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {Object.values(truckGroups).map((group) => {
            if (!group.truckPoint) return null;

            return (
              <Marker
                key={`${group.truck.id}-truck`}
                position={group.truckPoint.position}
                icon={createTruckIcon(group.truck)}
                zIndexOffset={1000}
              >
                <Popup>
                  <div className="space-y-2 min-w-[230px]">
                    <h4
                      className="font-bold"
                      style={{ color: group.truck.color }}
                    >
                      {group.truck.name} - {group.truck.label}
                    </h4>

                    <p>
                      <strong>Truck Status:</strong>{" "}
                      {getTruckStatusLabel(group.truck.status)}
                    </p>

                    <p>
                      <strong>Current Route:</strong>{" "}
                      {group.truckPoint.barangay}
                    </p>

                    <p>
                      <strong>Request Status:</strong>{" "}
                      {group.truckPoint.displayStatus}
                    </p>

                    <p>
                      <strong>Assigned Waste:</strong>{" "}
                      {group.truck.assignedWaste}
                    </p>

                    <p>
                      <strong>Request Waste:</strong> {group.truckPoint.waste}
                    </p>

                    {group.truckPoint.isReassignedToBackup && (
                      <p className="text-xs text-red-600 font-semibold">
                        This route was reassigned to the backup truck because
                        the main truck is unavailable or under maintenance.
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {mapPoints.map((point) => (
            <Fragment key={point.id}>
              <Marker
                position={point.position}
                icon={getIcon(point.status)}
                zIndexOffset={point.zIndexOffset}
              >
                <Popup>
                  <div className="space-y-2 min-w-[230px]">
                    <h4 className="font-bold text-green-700">
                      {point.barangay}
                    </h4>

                    <p>
                      <strong>Status:</strong> {point.displayStatus}
                    </p>

                    <p>
                      <strong>Collection Point:</strong>{" "}
                      {point.collectionPoint}
                    </p>

                    <p>
                      <strong>Waste Type:</strong> {point.waste}
                    </p>

                    <p>
                      <strong>Estimated:</strong> {formatKg(point.weight)}
                    </p>

                    <p>
                      <strong>Assigned Truck:</strong>{" "}
                      {point.needsReschedule
                        ? "Needs Reschedule"
                        : `${point.assignedTruck.name} - ${point.assignedTruck.shortLabel}`}
                    </p>

                    {point.isReassignedToBackup && (
                      <p className="text-xs text-red-600 font-semibold">
                        Reassigned from {point.originalAssignedTruck.name} to
                        Truck 4 because the main truck is unavailable.
                      </p>
                    )}

                    {point.needsReschedule && (
                      <div className="rounded-xl bg-red-50 border border-red-200 p-2">
                        <p className="text-xs text-red-700 font-bold">
                          Needs Reschedule
                        </p>

                        <p className="text-xs text-red-600 mt-1">
                          {point.rescheduleReason}
                        </p>

                        <button
                          type="button"
                          onClick={() => setSelectedRescheduleRequest(point)}
                          className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700"
                        >
                          Reschedule Route
                        </button>
                      </div>
                    )}

                    {isActiveRouteStatus(point.status) &&
                      !point.needsReschedule && (
                        <p
                          className="text-xs font-semibold"
                          style={{ color: point.assignedTruck.color }}
                        >
                          This barangay is included in the current route of{" "}
                          {point.assignedTruck.name}.
                        </p>
                      )}

                    {point.status === "collected" && (
                      <p className="text-xs text-gray-500">
                        This barangay currently has no newer active request. The
                        collected marker will disappear after 24 hours.
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>

              <Circle
                center={point.position}
                radius={130}
                pathOptions={{
                  color: point.needsReschedule
                    ? "#dc2626"
                    : getCircleColor(point.status),
                  fillColor: point.needsReschedule
                    ? "#dc2626"
                    : getCircleColor(point.status),
                  fillOpacity: 0.15,
                }}
              />
            </Fragment>
          ))}
        </MapContainer>

        {loadingRoute && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-white/95 border shadow rounded-2xl px-5 py-3 text-sm text-gray-600">
            Loading road routes...
          </div>
        )}

        {mapPoints.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-white/95 border shadow rounded-2xl px-5 py-3 text-sm text-gray-600">
            No active pickup requests to display on the map.
          </div>
        )}

        {activeTruckCount > 0 && (
          <div className="absolute bottom-5 left-5 z-[500] bg-white/95 border shadow rounded-2xl px-5 py-4 max-w-[380px]">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-2xl bg-green-700 text-white flex items-center justify-center text-2xl">
                🚛
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">
                  Truck Route Monitoring Active
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Routes are assigned by waste category. Truck 4 can serve as a
                  backup if another truck becomes unavailable.
                </p>
              </div>
            </div>
          </div>
        )}

        {rescheduleCount > 0 && (
          <div className="absolute bottom-5 right-5 z-[500] bg-red-50/95 border border-red-200 shadow rounded-2xl px-5 py-4 max-w-[420px]">
            <p className="text-sm font-bold text-red-700">
              Routes Need Rescheduling
            </p>

            <p className="text-xs text-red-600 mt-1">
              {rescheduleCount} request
              {rescheduleCount > 1 ? "s are" : " is"} affected because the
              assigned truck is unavailable and Truck 4 is already handling
              another backup route.
            </p>

            <div className="mt-3 space-y-2">
              {reschedulePoints.slice(0, 3).map((point) => (
                <div
                  key={point.id}
                  className="rounded-xl border border-red-200 bg-white/80 px-3 py-2"
                >
                  <p className="text-xs text-red-700 font-semibold">
                    CR-{String(point.id).padStart(3, "0")} • {point.barangay}
                  </p>

                  <p className="text-[11px] text-red-600 mt-0.5">
                    {point.originalAssignedTruck.name} unavailable
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedRescheduleRequest(point)}
                    className="mt-2 rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700"
                  >
                    Reschedule Route
                  </button>
                </div>
              ))}

              {reschedulePoints.length > 3 && (
                <p className="text-xs text-red-500">
                  +{reschedulePoints.length - 3} more request(s)
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-6 border-t bg-gray-50">
        <MapStat label="Pending" value={pendingCount} color="orange" />
        <MapStat label="Scheduled" value={scheduledCount} color="blue" />
        <MapStat label="In Progress" value={inProgressCount} color="yellow" />
        <MapStat label="Collected" value={collectedCount} color="green" />
        <MapStat label="Missed" value={missedCount} color="gray" />
        <MapStat label="Improper" value={improperCount} color="red" />
      </div>

      {selectedTruck && (
        <TruckStatusModal
          truck={selectedTruck}
          group={truckGroups[selectedTruck.id]}
          updatingTruck={updatingTruck}
          onClose={() => setSelectedTruck(null)}
          onUpdateStatus={updateTruckStatus}
        />
      )}

      {selectedRescheduleRequest && (
        <RescheduleRouteModal
          request={selectedRescheduleRequest}
          onClose={() => setSelectedRescheduleRequest(null)}
          onSuccess={handleRescheduleSuccess}
        />
      )}
    </div>
  );
}

function TruckStatusModal({
  truck,
  group,
  updatingTruck,
  onClose,
  onUpdateStatus,
}) {
  const activeCount = group?.activePoints?.length || 0;
  const currentRoute = group?.truckPoint?.barangay || "No active route";

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
        <div
          className="px-6 py-5 text-white"
          style={{ backgroundColor: truck.color }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">
                {truck.name} - {truck.label}
              </h3>

              <p className="text-sm text-white/90 mt-1">
                Manage truck status and route availability.
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-white/20 hover:bg-white/30 h-8 w-8"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoBox
              label="Current Status"
              value={getTruckStatusLabel(truck.status)}
            />
            <InfoBox label="Current Route" value={currentRoute} />
            <InfoBox label="Active Requests" value={String(activeCount)} />
            <InfoBox label="Truck Role" value={truck.shortLabel} />
          </div>

          <div className="rounded-2xl border bg-gray-50 p-4">
            <p className="text-xs text-gray-500">Assigned Waste</p>

            <p className="text-sm font-semibold text-gray-800 mt-1">
              {truck.assignedWaste}
            </p>
          </div>

          {truck.id !== "truck_4" &&
            isTruckUnavailableForRoute(truck.status) && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-bold text-red-700">
                  Backup or reschedule required
                </p>

                <p className="text-xs text-red-600 mt-1">
                  If Truck 4 is available, this truck&apos;s active route can be
                  assigned to Truck 4. If Truck 4 is already handling another
                  backup route, this truck&apos;s route should be rescheduled.
                </p>
              </div>
            )}

          <div>
            <p className="text-sm font-bold text-gray-800 mb-3">
              Update Truck Status
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TRUCK_STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => onUpdateStatus(truck, status)}
                  disabled={updatingTruck || truck.status === status}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    truck.status === status
                      ? "bg-gray-900 text-white"
                      : "bg-white hover:bg-gray-50 text-gray-700"
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {getTruckStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Only LGU/MENRO should update truck availability. Collector and
            barangay users should only view assigned truck information.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function TruckRouteCard({ truck, truckPoint, activeCount, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border px-4 py-3 ${truck.bgClass} hover:shadow-md transition`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-bold ${truck.textClass}`}>
            {truck.name}
          </p>

          <p className="text-xs font-semibold text-gray-700">{truck.label}</p>
        </div>

        <div
          className="h-10 w-10 rounded-2xl text-white flex items-center justify-center text-xl shadow-sm"
          style={{ backgroundColor: truck.color }}
        >
          🚛
        </div>
      </div>

      <div className="mt-3">
        <TruckStatusPill status={truck.status} />
      </div>

      <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">
        {truck.assignedWaste}
      </p>

      <div className="mt-3 rounded-xl bg-white/70 border px-3 py-2">
        {truckPoint ? (
          <>
            <p className="text-[11px] text-gray-500">Current Route</p>

            <p className={`text-xs font-bold ${truck.textClass}`}>
              {truckPoint.barangay}
            </p>

            <p className="text-[11px] text-gray-500 mt-1">
              {activeCount} active request{activeCount > 1 ? "s" : ""}
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] text-gray-500">Current Route</p>
            <p className="text-xs font-bold text-gray-500">No active route</p>
          </>
        )}
      </div>
    </button>
  );
}

function TruckStatusPill({ status }) {
  const normalized = normalizeTruckStatus(status);

  const styles = {
    available: "bg-green-100 text-green-700",
    on_route: "bg-blue-100 text-blue-700",
    under_maintenance: "bg-yellow-100 text-yellow-700",
    unavailable: "bg-red-100 text-red-700",
    backup_active: "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${
        styles[normalized] || "bg-gray-100 text-gray-700"
      }`}
    >
      {getTruckStatusLabel(normalized)}
    </span>
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
      remarks: foundTruck.remarks || defaultTruck.remarks,
      updatedAt: foundTruck.updated_at,
    };
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

function getSortedActiveRoutePoints(points) {
  return [...points]
    .filter((point) => isActiveRouteStatus(point.status))
    .sort((a, b) => {
      const statusPriority = {
        "in progress": 1,
        scheduled: 2,
        pending: 3,
      };

      const aPriority = statusPriority[a.status] || 99;
      const bPriority = statusPriority[b.status] || 99;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return new Date(a.statusUpdatedAt || 0) - new Date(b.statusUpdatedAt || 0);
    });
}

function getTruckPoint(activeRoutePoints) {
  if (activeRoutePoints.length === 0) return null;

  const inProgressPoint = activeRoutePoints.find(
    (point) => point.status === "in progress"
  );

  if (inProgressPoint) return inProgressPoint;

  const scheduledPoint = activeRoutePoints.find(
    (point) => point.status === "scheduled"
  );

  if (scheduledPoint) return scheduledPoint;

  return activeRoutePoints[0];
}

function isActiveRouteStatus(status) {
  return (
    status === "pending" || status === "scheduled" || status === "in progress"
  );
}

function getCurrentBarangayRequests(requests) {
  const barangayMap = {};

  requests.forEach((request) => {
    const barangayKey = normalizeBarangayName(request.barangay);

    if (!barangayKey) return;

    if (!barangayMap[barangayKey]) {
      barangayMap[barangayKey] = [];
    }

    barangayMap[barangayKey].push(request);
  });

  return Object.values(barangayMap)
    .map((barangayRequests) => {
      const sortedRequests = [...barangayRequests].sort((a, b) => {
        const aDate = getRequestTime(a);
        const bDate = getRequestTime(b);

        return bDate - aDate;
      });

      const latestActiveRequest = sortedRequests.find((request) => {
        const status = normalizeStatus(request.status);

        return (
          status === "pending" ||
          status === "scheduled" ||
          status === "in progress"
        );
      });

      if (latestActiveRequest) {
        return latestActiveRequest;
      }

      const latestRequest = sortedRequests[0];

      if (!latestRequest) return null;

      const latestStatus = normalizeStatus(latestRequest.status);

      if (latestStatus === "collected" && !isCollectedExpired(latestRequest)) {
        return latestRequest;
      }

      if (
        latestStatus === "missed" ||
        latestStatus === "improper segregation"
      ) {
        return latestRequest;
      }

      return null;
    })
    .filter(Boolean);
}

function getRequestTime(request) {
  return new Date(
    request.status_updated_at || request.updated_at || request.created_at || 0
  ).getTime();
}

function getIcon(status) {
  if (status === "collected") return greenIcon;
  if (status === "scheduled") return blueIcon;
  if (status === "in progress") return yellowIcon;
  if (status === "missed") return greyIcon;
  if (status === "improper segregation") return redIcon;

  return orangeIcon;
}

function getCircleColor(status) {
  if (status === "collected") return "#16a34a";
  if (status === "scheduled") return "#2563eb";
  if (status === "in progress") return "#eab308";
  if (status === "missed") return "#6b7280";
  if (status === "improper segregation") return "#dc2626";

  return "#f97316";
}

function getDisplayStatus(status) {
  if (status === "pending") return "Pending";
  if (status === "scheduled") return "Scheduled";
  if (status === "in progress") return "In Progress";
  if (status === "collected") return "Collected";
  if (status === "missed") return "Missed";
  if (status === "improper segregation") return "Improper Segregation";

  return "Pending";
}

function getMarkerZIndex(status) {
  if (status === "pending") return 600;
  if (status === "scheduled") return 500;
  if (status === "in progress") return 400;
  if (status === "collected") return 300;
  if (status === "missed") return 200;
  if (status === "improper segregation") return 100;

  return 50;
}

function normalizeStatus(value) {
  return String(value || "Pending").trim().toLowerCase();
}

function normalizeTruckStatus(value) {
  const status = String(value || "available").trim().toLowerCase();

  if (TRUCK_STATUS_OPTIONS.includes(status)) {
    return status;
  }

  return "available";
}

function getTruckStatusLabel(status) {
  const normalized = normalizeTruckStatus(status);

  const labels = {
    available: "Available",
    on_route: "On Route",
    under_maintenance: "Under Maintenance",
    unavailable: "Unavailable",
    backup_active: "Backup Active",
  };

  return labels[normalized] || "Available";
}

function isCollectedExpired(request) {
  const collectedTime =
    request.status_updated_at || request.updated_at || request.created_at;

  if (!collectedTime) return false;

  const collectedDate = new Date(collectedTime).getTime();
  const now = Date.now();

  const oneDay = 24 * 60 * 60 * 1000;

  return now - collectedDate > oneDay;
}

function findBarangayLocation(barangayName, barangayLocations) {
  const normalizedRequestBarangay = normalizeBarangayName(barangayName);

  return barangayLocations.find(
    (item) => normalizeBarangayName(item.barangay) === normalizedRequestBarangay
  );
}

function normalizeBarangayName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^barangay\s+/i, "")
    .replace(/^brgy\.?\s+/i, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function MapStat({ label, value, color }) {
  const colors = {
    green: "text-green-700 bg-green-100",
    orange: "text-orange-600 bg-orange-100",
    blue: "text-blue-700 bg-blue-100",
    yellow: "text-yellow-700 bg-yellow-100",
    gray: "text-gray-700 bg-gray-100",
    red: "text-red-700 bg-red-100",
  };

  return (
    <div className="bg-white rounded-2xl border p-4">
      <p className="text-sm text-gray-500">{label}</p>

      <div
        className={`mt-2 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${colors[color]}`}
      >
        {value}
      </div>
    </div>
  );
}

function formatKg(value) {
  if (value === null || value === undefined || value === "") return "N/A";

  const text = String(value).trim();

  if (text.toLowerCase().includes("kg")) {
    return text;
  }

  return `${text} kg`;
}