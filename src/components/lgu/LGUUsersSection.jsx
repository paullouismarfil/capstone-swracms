import { useEffect, useState } from "react";
import {
  Plus,
  X,
  Users,
  ShieldCheck,
  Mail,
  Home,
  Phone,
  KeyRound,
  MapPin,
  Lock,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function LGUUsersSection() {
  const [users, setUsers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    id: "",
    full_name: "",
    email: "",
    role: "barangay_user",
    barangay: "",
    latitude: "",
    longitude: "",
    contact_number: "",
    status: "active",
  });

  useEffect(() => {
    loadCurrentUser();
    fetchUsers();
  }, []);

  async function loadCurrentUser() {
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;

    if (user?.id) {
      setCurrentUserId(user.id);
    }
  }

  async function fetchUsers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("role", { ascending: true })
      .order("full_name", { ascending: true });

    if (error) {
      console.error(error);
      alert("Failed to load users.");
      setLoading(false);
      return;
    }

    setUsers(data || []);
    setLoading(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => {
      if (name === "role") {
        return {
          ...prev,
          role: value,
          barangay: value === "barangay_user" ? prev.barangay : "",
          latitude: value === "barangay_user" ? prev.latitude : "",
          longitude: value === "barangay_user" ? prev.longitude : "",
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  }

  function resetForm() {
    setFormData({
      id: "",
      full_name: "",
      email: "",
      role: "barangay_user",
      barangay: "",
      latitude: "",
      longitude: "",
      contact_number: "",
      status: "active",
    });
  }

  async function handleAddUser(e) {
    e.preventDefault();

    if (!formData.id.trim()) {
      alert("Please enter the Auth User ID from Supabase Authentication.");
      return;
    }

    if (!formData.full_name.trim() || !formData.email.trim() || !formData.role) {
      alert("Please fill in full name, email, and role.");
      return;
    }

    if (formData.role === "barangay_user" && !formData.barangay.trim()) {
      alert("Please enter the assigned barangay.");
      return;
    }

    const hasLatitude = formData.latitude.trim() !== "";
    const hasLongitude = formData.longitude.trim() !== "";

    if (formData.role === "barangay_user" && hasLatitude !== hasLongitude) {
      alert("Please enter both latitude and longitude, or leave both blank.");
      return;
    }

    if (
      formData.role === "barangay_user" &&
      hasLatitude &&
      hasLongitude &&
      (Number.isNaN(Number(formData.latitude)) ||
        Number.isNaN(Number(formData.longitude)))
    ) {
      alert("Latitude and longitude must be valid numbers.");
      return;
    }

    setSaving(true);

    const profilePayload = {
      id: formData.id.trim(),
      email: formData.email.trim().toLowerCase(),
      full_name: formData.full_name.trim(),
      role: formData.role,
      barangay:
        formData.role === "barangay_user" ? formData.barangay.trim() : null,
      contact_number: formData.contact_number.trim(),
      status: formData.status,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload, {
        onConflict: "id",
      });

    if (profileError) {
      setSaving(false);
      console.error("Save user profile error:", profileError);
      alert(
        profileError.message ||
          "Failed to save user profile. Check profiles table or RLS."
      );
      return;
    }

    if (formData.role === "barangay_user" && hasLatitude && hasLongitude) {
      const { error: locationError } = await supabase
        .from("barangay_locations")
        .upsert(
          {
            barangay: formData.barangay.trim(),
            latitude: Number(formData.latitude),
            longitude: Number(formData.longitude),
          },
          {
            onConflict: "barangay",
          }
        );

      if (locationError) {
        setSaving(false);
        console.error("Save barangay location error:", locationError);
        alert(
          "User profile was saved, but barangay map location failed to save. Check barangay_locations table or RLS."
        );
        return;
      }
    }

    setSaving(false);

    alert("User profile saved successfully.");
    resetForm();
    setShowAddModal(false);
    fetchUsers();
  }

  async function updateUserStatus(user, status) {
    if (!user?.id) {
      alert("User ID not found.");
      return;
    }

    if (String(user.id) === String(currentUserId)) {
      alert("You cannot deactivate your own LGU admin account.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      alert(error.message || "Failed to update user status.");
      return;
    }

    fetchUsers();
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Manage Users</h3>
          <p className="text-sm text-gray-500">
            Register and manage LGU, barangay, and collection staff profiles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-green-700 text-white px-4 py-3 rounded-2xl text-sm font-semibold hover:bg-green-800 transition"
        >
          <Plus size={18} />
          Add User
        </button>
      </div>

      <div className="p-4 bg-yellow-50 border-b border-yellow-100">
        <p className="text-sm text-yellow-800">
          Google Account Flow: Let each user log in once using Google, then copy
          their Supabase Auth User UID and save their profile here using the same
          email, Auth User ID, role, and assigned barangay.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th className="p-4 text-left">User</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">Role</th>
              <th className="p-4 text-left">Barangay</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="6">
                  Loading users...
                </td>
              </tr>
            )}

            {!loading && users.length === 0 && (
              <tr>
                <td className="p-4 text-gray-500" colSpan="6">
                  No users found.
                </td>
              </tr>
            )}

            {!loading &&
              users.map((user) => {
                const isCurrentAccount =
                  String(user.id) === String(currentUserId);

                return (
                  <tr
                    key={user.id || user.email}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <p className="font-semibold text-gray-900">
                        {user.full_name || user.name || "Unnamed User"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {user.contact_number || "No contact number"}
                      </p>
                    </td>

                    <td className="p-4 text-gray-600">
                      {user.email || "No email"}
                    </td>

                    <td className="p-4">
                      <RoleBadge role={user.role} />
                    </td>

                    <td className="p-4 text-gray-600">
                      {user.barangay || "—"}
                    </td>

                    <td className="p-4">
                      <StatusBadge status={user.status} />
                    </td>

                    <td className="p-4">
                      {isCurrentAccount ? (
                        <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-600">
                          <Lock size={14} />
                          Current Account
                        </span>
                      ) : user.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => updateUserStatus(user, "inactive")}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateUserStatus(user, "active")}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">Add User Profile</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Create or sign in the Google account first, then paste the
                  Supabase Auth User UID here.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="w-10 h-10 rounded-2xl border flex items-center justify-center hover:bg-gray-50 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField
                  icon={<KeyRound size={18} />}
                  label="Auth User ID"
                  name="id"
                  value={formData.id}
                  onChange={handleChange}
                  placeholder="Paste Supabase Auth User UID"
                />

                <InputField
                  icon={<Users size={18} />}
                  label="Full Name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Example: Barangay Alangan Representative"
                />

                <InputField
                  icon={<Mail size={18} />}
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                  type="email"
                />

                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Role
                  </label>

                  <div className="mt-2 flex items-center gap-3 border rounded-2xl px-4 py-3 bg-gray-50 focus-within:border-green-500">
                    <ShieldCheck size={18} className="text-gray-400" />

                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full bg-transparent outline-none text-sm text-gray-800"
                    >
                      <option value="barangay_user">Barangay User</option>
                      <option value="collection_staff">Collection Staff</option>
                      <option value="lgu_admin">LGU Admin</option>
                    </select>
                  </div>
                </div>

                {formData.role === "barangay_user" && (
                  <>
                    <InputField
                      icon={<Home size={18} />}
                      label="Assigned Barangay"
                      name="barangay"
                      value={formData.barangay}
                      onChange={handleChange}
                      placeholder="Example: Barangay Alangan"
                    />

                    <InputField
                      icon={<MapPin size={18} />}
                      label="Latitude Optional"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="Example: 10.7738"
                      type="number"
                      step="any"
                    />

                    <InputField
                      icon={<MapPin size={18} />}
                      label="Longitude Optional"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="Example: 122.0098"
                      type="number"
                      step="any"
                    />
                  </>
                )}

                <InputField
                  icon={<Phone size={18} />}
                  label="Contact Number"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  placeholder="Example: 09123456789"
                />

                <div>
                  <label className="text-sm font-semibold text-gray-700">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-2 w-full border rounded-2xl px-4 py-3 outline-none focus:border-green-500 bg-gray-50"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-sm font-semibold text-blue-800">
                  Barangay map location
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Latitude and longitude are optional. Add them only when you
                  already have the correct barangay coordinates. If provided,
                  they will be saved to barangay_locations for the LGU Collection
                  Map.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-5 py-3 rounded-2xl border text-sm font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-3 rounded-2xl bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InputField({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon,
  type = "text",
  step,
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>

      <div className="mt-2 flex items-center gap-3 border rounded-2xl px-4 py-3 bg-gray-50 focus-within:border-green-500 focus-within:bg-white transition">
        <span className="text-gray-400">{icon}</span>

        <input
          type={type}
          step={step}
          name={name}
          value={value || ""}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-sm text-gray-800"
        />
      </div>
    </div>
  );
}

function RoleBadge({ role }) {
  const label =
    role === "lgu_admin"
      ? "LGU Admin"
      : role === "barangay_user"
      ? "Barangay User"
      : role === "collection_staff"
      ? "Collection Staff"
      : role || "Unknown";

  return (
    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
      {label}
    </span>
  );
}

function StatusBadge({ status }) {
  const currentStatus = status || "inactive";

  const style =
    currentStatus === "active"
      ? "bg-green-100 text-green-700"
      : currentStatus === "suspended"
      ? "bg-orange-100 text-orange-700"
      : "bg-red-100 text-red-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>
      {currentStatus}
    </span>
  );
}