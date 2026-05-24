import ScheduleMiniCard from "./ScheduleMiniCard";

export default function BarangayScheduleCard({ schedule, barangay }) {
  if (!schedule) {
    return (
      <div className="xl:col-span-3 bg-white rounded-3xl shadow-sm border p-6">
        <h3 className="text-xl font-bold">Assigned Collection Schedule</h3>
        <p className="text-sm text-gray-500 mt-1">
          No schedule detected yet for {barangay || "this barangay"}.
        </p>
      </div>
    );
  }

  return (
    <div className="xl:col-span-3 bg-gradient-to-br from-green-700 to-green-900 text-white rounded-3xl shadow-sm p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <p className="text-green-100 text-sm">
            Assigned MENRO Collection Schedule
          </p>

          <h3 className="text-3xl font-bold mt-1">{barangay}</h3>

          <p className="text-green-100 mt-2">
            Your barangay is assigned to the {schedule.group} collection route.
          </p>
        </div>

        <div className="bg-white/15 rounded-2xl p-5 min-w-[260px]">
          <p className="text-green-100 text-sm">Collection Group</p>
          <h4 className="text-2xl font-bold">{schedule.group}</h4>
          <p className="text-green-100 text-sm mt-1">{schedule.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <ScheduleMiniCard label="Time" value={schedule.time} />
        <ScheduleMiniCard label="Allowed Waste" value={schedule.wasteCategory} />
        <ScheduleMiniCard
          label="Route Assignment"
          value={schedule.assignedDropOffSchedule || schedule.group}
        />
      </div>

      <div className="mt-6 bg-white/10 rounded-2xl p-4">
        <p className="font-semibold">Reminder</p>
        <p className="text-green-100 text-sm mt-1">
          Please gather waste at the designated barangay collection point before
          the assigned MENRO truck schedule.
        </p>
      </div>
    </div>
  );
}