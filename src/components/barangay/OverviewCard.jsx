export default function OverviewCard({ title, value }) {
  return (
    <div className="border rounded-2xl p-5 bg-gray-50">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-xl font-bold text-green-700 mt-2">{value}</h3>
    </div>
  );
}