export default function StatusBadge({ status }) {
  const style =
    status === "Collected"
      ? "bg-green-100 text-green-700"
      : status === "Scheduled"
      ? "bg-blue-100 text-blue-700"
      : status === "In Progress"
      ? "bg-yellow-100 text-yellow-700"
      : status === "Missed"
      ? "bg-red-100 text-red-600"
      : "bg-orange-100 text-orange-600";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}