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

  const mapPoints =
    requests.length > 0
      ? requests.map((request) => {
          const foundLocation = findBarangayLocation(
            request.barangay,
            barangayLocations
          );

          return {
            id: request.id,
            barangay:
              request.barangay ||
              foundLocation?.barangay ||
              "Unknown Barangay",
            status: request.status || "Pending",
            waste: request.waste_type || "Unspecified",
            weight:
              request.estimated_weight ||
              request.actual_weight ||
              request.weight ||
              "N/A",
            collectionPoint: request.collection_point || "N/A",
            position: foundLocation
              ? [foundLocation.latitude, foundLocation.longitude]
              : sibalomCenter,
          };
        })
      : barangayLocations.length > 0
      ? barangayLocations.slice(0, 5).map((item) => ({
          id: item.id,
          barangay: item.barangay,
          status: "Pending",
          waste: "No request yet",
          weight: "N/A",
          collectionPoint: "Barangay collection point",
          position: [item.latitude, item.longitude],
        }))
      : [
          {
            id: 1,
            barangay: "Barangay Poblacion",
            status: "Pending",
            waste: "No request yet",
            weight: "N/A",
            collectionPoint: "Barangay Hall",
            position: sibalomCenter,
          },
        ];

  function getIcon(status) {
    if (status === "Collected") return greenIcon;
    if (status === "Scheduled") return blueIcon;
    return orangeIcon;
  }

  function getCircleColor(status) {
    if (status === "Collected") return "#16a34a";
    if (status === "Scheduled") return "#2563eb";
    return "#f97316";
  }

  const collectedCount = mapPoints.filter((p) => p.status === "Collected").length;
  const scheduledCount = mapPoints.filter((p) => p.status === "Scheduled").length;
  const pendingCount = mapPoints.filter((p) => p.status === "Pending").length;

  return (
    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b">
        <h3 className="text-2xl font-bold">Collection Monitoring Map</h3>
        <p className="text-gray-500 mt-1">
          Monitor barangay collection points, pickup requests, and current
          status.
        </p>
      </div>

      <div className="h-[650px] w-full">
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
            >
              <Popup>
                <div className="space-y-2 min-w-[190px]">
                  <h4 className="font-bold text-green-700">
                    {point.barangay}
                  </h4>

                  <p>
                    <strong>Status:</strong> {point.status}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-t bg-gray-50">
        <MapStat label="Collected" value={collectedCount} color="green" />
        <MapStat label="Pending" value={pendingCount} color="orange" />
        <MapStat label="Scheduled" value={scheduledCount} color="blue" />
      </div>
    </div>
  );
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