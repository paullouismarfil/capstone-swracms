import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
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

export default function CollectionMap({ requests = [] }) {
  const sibalomCenter = [10.7903, 122.0176];
  const [barangayLocations, setBarangayLocations] = useState([]);

  useEffect(() => {
    fetchBarangayLocations();
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

  const currentBarangayRequests = getCurrentBarangayRequests(requests);

  const mapPoints = currentBarangayRequests
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

      return {
        id: request.id,
        barangay:
          request.barangay || foundLocation?.barangay || "Unknown Barangay",
        status,
        displayStatus,
        waste: request.waste_type || "Unspecified",
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

  return (
    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-2xl font-bold">Collection Monitoring Map</h3>

        <p className="text-gray-500 mt-1">
          Monitor barangay collection points, pickup requests, and current
          status.
        </p>
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

          {mapPoints.map((point) => (
            <Marker
              key={point.id}
              position={point.position}
              icon={getIcon(point.status)}
              zIndexOffset={point.zIndexOffset}
            >
              <Popup>
                <div className="space-y-2 min-w-[190px]">
                  <h4 className="font-bold text-green-700">
                    {point.barangay}
                  </h4>

                  <p>
                    <strong>Status:</strong> {point.displayStatus}
                  </p>

                  <p>
                    <strong>Collection Point:</strong> {point.collectionPoint}
                  </p>

                  <p>
                    <strong>Waste Type:</strong> {point.waste}
                  </p>

                  <p>
                    <strong>Estimated:</strong> {formatKg(point.weight)}
                  </p>

                  {point.status === "collected" && (
                    <p className="text-xs text-gray-500">
                      This barangay currently has no newer active request. The
                      collected marker will disappear after 24 hours.
                    </p>
                  )}
                </div>
              </Popup>

              <Circle
                center={point.position}
                radius={130}
                pathOptions={{
                  color: getCircleColor(point.status),
                  fillColor: getCircleColor(point.status),
                  fillOpacity: 0.15,
                }}
              />
            </Marker>
          ))}
        </MapContainer>

        {mapPoints.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-white/95 border shadow rounded-2xl px-5 py-3 text-sm text-gray-600">
            No active pickup requests to display on the map.
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
    </div>
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