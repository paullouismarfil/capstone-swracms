import BarangayScheduleCard from "./BarangayScheduleCard";

export default function BarangaySchedulePage({ schedule, barangay }) {
  return (
    <div className="grid grid-cols-1 gap-6">
      <BarangayScheduleCard schedule={schedule} barangay={barangay} />

      {schedule && (
        <div className="bg-white rounded-3xl shadow-sm border p-6">
          <h3 className="text-xl font-bold">Covered Barangays</h3>
          <p className="text-sm text-gray-500 mb-5">
            Barangays included in this MENRO collection route.
          </p>

          <div className="flex flex-wrap gap-2">
            {schedule.barangays?.map((item) => (
              <span
                key={item}
                className="bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full text-xs font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}