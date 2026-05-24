export default function ScheduleMiniCard({ label, value }) {
  return (
    <div className="bg-white/15 rounded-2xl p-4">
      <p className="text-green-100 text-sm">{label}</p>
      <p className="font-bold mt-1">{value}</p>
    </div>
  );
}