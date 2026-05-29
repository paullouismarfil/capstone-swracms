import { Truck } from "lucide-react";

export default function LGUScheduleSection({ schedules, compact }) {
  return (
    <div
      className={`${
        compact ? "xl:col-span-2" : ""
      } bg-white rounded-3xl shadow-sm border p-6`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold">MENRO Collection Schedule</h3>
          <p className="text-sm text-gray-500">
            Actual segregated collection schedule for other coverage barangays.
          </p>
        </div>

        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold">
          Residual Waste Only • 10:00 AM - 3:00 PM
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {schedules.map((item) => (
          <ScheduleCard key={item.group} item={item} />
        ))}
      </div>
    </div>
  );
}

function ScheduleCard({ item }) {
  return (
    <div className="border rounded-2xl p-5 hover:bg-gray-50 transition">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <Truck className="text-green-700" size={23} />

          <div>
            <p className="font-bold text-lg">{item.group}</p>
            <p className="text-xs text-gray-500">{item.description}</p>
          </div>
        </div>

        <div className="mt-3 space-y-1 text-sm text-gray-600">
          <p>
            <span className="font-semibold">Time:</span> {item.time}
          </p>
          <p>
            <span className="font-semibold">Waste:</span> {item.wasteCategory}
          </p>
          <p>
            <span className="font-semibold">Vehicle:</span> MENRO Garbage Truck
          </p>
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">
          Covered Barangays
        </p>

        <div className="flex flex-wrap gap-2">
          {item.barangays.map((barangay) => (
            <span
              key={barangay}
              className="bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full text-xs font-medium"
            >
              {barangay}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}