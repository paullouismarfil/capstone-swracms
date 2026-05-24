function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between bg-white/10 rounded-2xl p-4">
      <p className="text-green-100">{label}</p>
      <p className="text-lg font-bold text-right max-w-[180px]">{value}</p>
    </div>
  );
}

export default function TodaySummary({ assigned, inProgress, completed, route }) {
  return (
    <div className="bg-gradient-to-br from-green-700 to-green-900 text-white rounded-3xl shadow-sm p-6">
      <h3 className="text-xl font-bold">Today’s Route Summary</h3>

      <p className="text-green-100 text-sm mt-1">
        Current collection progress for the single MENRO truck.
      </p>

      <div className="mt-6 space-y-4">
        <SummaryRow label="Current Route" value={route} />
        <SummaryRow label="Assigned Requests" value={assigned} />
        <SummaryRow label="In Progress" value={inProgress} />
        <SummaryRow label="Completed Records" value={completed} />
      </div>
    </div>
  );
}