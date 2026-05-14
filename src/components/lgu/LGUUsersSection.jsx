export default function LGUUsersSection() {
  const users = [
    { name: "MENRO Admin", role: "Administrator", status: "Active" },
    { name: "Barangay Poblacion", role: "Barangay User", status: "Active" },
    { name: "Collection Team", role: "Collection Staff", status: "Active" },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Manage Users</h3>
          <p className="text-sm text-gray-500">
            Manage LGU, barangay, and collection staff accounts.
          </p>
        </div>

        <button className="bg-green-700 text-white px-4 py-2 rounded-xl text-sm">
          Add User
        </button>
      </div>

      <table className="w-full">
        <thead className="bg-gray-50 text-gray-500 text-sm">
          <tr>
            <th className="p-4 text-left">User</th>
            <th className="p-4 text-left">Role</th>
            <th className="p-4 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.name} className="border-t hover:bg-gray-50">
              <td className="p-4 font-semibold">{user.name}</td>

              <td className="p-4 text-gray-600">{user.role}</td>

              <td className="p-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  {user.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}