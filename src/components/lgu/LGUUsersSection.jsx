import { useEffect, useState } from "react";
import {
  Plus,
  X,
  Users,
  ShieldCheck,
  Mail,
  Home,
  Phone,
  MapPin,
  Lock,
  Copy,
  UserPlus,
  Ban,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function LGUUsersSection() {
  const [users, setUsers] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [barangayLocations, setBarangayLocations] = useState([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAccessRequests, setLoadingAccessRequests] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
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
    fetchAccessRequests();
    fetchBarangayLocations();
  }, []);

  async function loadCurrentUser() {
    const { data } = await supabase.auth.getSession();
    const user = data?.session?.user;

    if (user?.email) {
      setCurrentUserEmail(user.email.toLowerCase());
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

  async function fetchAccessRequests() {
    setLoadingAccessRequests(true);

    const { data, error } = await supabase
      .from("access_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch access requests error:", error);
      setAccessRequests([]);
      setLoadingAccessRequests(false);
      return;
    }

    setAccessRequests(data || []);
    setLoadingAccessRequests(false);
  }

  async function fetchBarangayLocations() {
    const { data, error } = await supabase
      .from("barangay_locations")
      .select("*")
      .order("barangay", { ascending: true });

    if (error) {
      console.error("Fetch barangay locations error:", error);
      alert("Failed to load barangay list. Check barangay_locations table.");
      return;
    }

    setBarangayLocations(data || []);
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

  function handleBarangayChange(e) {
    const selectedBarangay = e.target.value;

    const selectedLocation = barangayLocations.find(
      (item) => item.barangay === selectedBarangay
    );

    setFormData((prev) => ({
      ...prev,
      barangay: selectedBarangay,
      latitude:
        selectedLocation?.latitude !== null &&
          selectedLocation?.latitude !== undefined
          ? String(selectedLocation.latitude)
          : "",
      longitude:
        selectedLocation?.longitude !== null &&
          selectedLocation?.longitude !== undefined
          ? String(selectedLocation.longitude)
          : "",
    }));
  }

  function resetForm() {
    setFormData({
      full_name: "",
      email: "",
      role: "barangay_user",
      barangay: "",
      latitude: "",
      longitude: "",
      contact_number: "",
      status: "active",
    });

    setAgreedToTerms(false);
  }

  function closeAddUserModal() {
    if (saving) return;

    setShowAddModal(false);
    setShowConfirmModal(false);
    resetForm();
  }

  function handleUseRequestEmail(requestEmail) {
    setFormData((prev) => ({
      ...prev,
      email: String(requestEmail || "").trim().toLowerCase(),
    }));

    setShowAddModal(true);
  }

  async function copyEmail(email) {
    try {
      await navigator.clipboard.writeText(email);
      alert("Email copied: " + email);
    } catch {
      alert("Copy failed. Please copy manually: " + email);
    }
  }

  async function rejectAccessRequest(request) {
    const confirmed = window.confirm(
      `Reject access request from ${request.email}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("access_requests")
      .update({ status: "rejected" })
      .eq("id", request.id);

    if (error) {
      console.error(error);
      alert(error.message || "Failed to reject access request.");
      return;
    }

    fetchAccessRequests();
  }

  async function markAccessRequestApproved(email) {
    if (!email) return;

    const { error } = await supabase
      .from("access_requests")
      .update({ status: "approved" })
      .eq("email", String(email).trim().toLowerCase());

    if (error) {
      console.error("Approve access request error:", error);
      return;
    }

    fetchAccessRequests();
  }

  async function sendRegistrationEmail(profilePayload) {
    const { data, error } = await supabase.functions.invoke(
      "send-registration-email",
      {
        body: {
          email: profilePayload.email,
          full_name: profilePayload.full_name,
          role: profilePayload.role,
          barangay: profilePayload.barangay,
        },
      }
    );

    if (error) {
      console.error("Send registration email error:", error);
      return {
        success: false,
        message:
          error.message ||
          "User was saved, but the registration email was not sent.",
      };
    }

    if (data?.error) {
      console.error("Send registration email function error:", data.error);
      return {
        success: false,
        message: "User was saved, but the registration email was not sent.",
      };
    }

    return {
      success: true,
      message: "Registration email sent successfully.",
    };
  }

  function handleAddUser(e) {
    e.preventDefault();

    if (!formData.full_name.trim() || !formData.email.trim() || !formData.role) {
      alert("Please fill in full name, email, and role.");
      return;
    }

    if (formData.role === "barangay_user" && !formData.barangay.trim()) {
      alert("Please select the assigned barangay.");
      return;
    }

    setAgreedToTerms(false);
    setShowConfirmModal(true);
  }

  async function confirmCreateUser() {
    if (!agreedToTerms) {
      alert("Please confirm the terms before creating the user.");
      return;
    }

    setSaving(true);

    const normalizedEmail = formData.email.trim().toLowerCase();

    const profilePayload = {
      email: normalizedEmail,
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
        onConflict: "email",
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

    await markAccessRequestApproved(normalizedEmail);

    const emailResult = await sendRegistrationEmail(profilePayload);

    setSaving(false);
    setShowConfirmModal(false);

    if (emailResult.success) {
      alert("User profile saved successfully. Registration email sent.");
    } else {
      alert(
        "User profile saved successfully, but the acceptance email was not sent. Please check the Edge Function logs or Supabase Invite Email setup."
      );
    }

    resetForm();
    setShowAddModal(false);
    fetchUsers();
  }

  async function updateUserStatus(user, status) {
    if (!user?.email) {
      alert("User email not found.");
      return;
    }

    if (String(user.email).toLowerCase() === String(currentUserEmail)) {
      alert("You cannot deactivate your own LGU admin account.");
      return;
    }

    const confirmMessage =
      status === "disabled"
        ? `Are you sure you want to deactivate ${user.email}? This user will not be able to access the system.`
        : `Are you sure you want to activate ${user.email}?`;

    const confirmed = window.confirm(confirmMessage);

    if (!confirmed) return;

    const { error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("email", String(user.email).toLowerCase());

    if (error) {
      console.error(error);
      alert(error.message || "Failed to update user status.");
      return;
    }

    fetchUsers();
  }

  const selectedBarangayLocation = barangayLocations.find(
    (item) => item.barangay === formData.barangay
  );

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

      <div className="p-4 bg-green-50 border-b border-green-100">
        <p className="text-sm text-green-800">
          Email-Based Account Flow: Add the user's email, role, barangay
          assignment, and status here. When the user logs in using the same
          email, the system will recognize the profile automatically.
        </p>
      </div>

      <div className="p-4 bg-blue-50 border-b border-blue-100">
        <p className="text-sm text-blue-800">
          Barangay Location Flow: Barangay options are loaded from the
          barangay_locations table. Select a barangay from the dropdown and the
          saved latitude/longitude will be used for the LGU collection map.
        </p>
      </div>

      <section className="p-6 border-b bg-gray-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
          <div>
            <h4 className="text-lg font-bold text-gray-900">
              Pending Access Requests
            </h4>
            <p className="text-sm text-gray-500">
              Emails submitted from the Login page Request Access form.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchAccessRequests}
            className="px-4 py-2 rounded-xl border bg-white text-sm font-semibold hover:bg-gray-100"
          >
            Refresh Requests
          </button>
        </div>

        {loadingAccessRequests && (
          <div className="bg-white border rounded-2xl p-4 text-sm text-gray-500">
            Loading access requests...
          </div>
        )}

        {!loadingAccessRequests && accessRequests.length === 0 && (
          <div className="bg-white border rounded-2xl p-4 text-sm text-gray-500">
            No pending access requests.
          </div>
        )}

        {!loadingAccessRequests && accessRequests.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {accessRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 break-all">
                    {request.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Requested: {formatDate(request.created_at)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyEmail(request.email)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-semibold hover:bg-gray-50"
                  >
                    <Copy size={14} />
                    Copy
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUseRequestEmail(request.email)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-green-700 text-white text-xs font-semibold hover:bg-green-800"
                  >
                    <UserPlus size={14} />
                    Use in Add User
                  </button>

                  <button
                    type="button"
                    onClick={() => rejectAccessRequest(request)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100"
                  >
                    <Ban size={14} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
                  String(user.email || "").toLowerCase() ===
                  String(currentUserEmail).toLowerCase();

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
                          onClick={() => updateUserStatus(user, "disabled")}
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
                  Register the user by email. No need to copy the Supabase Auth
                  UID manually.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddUserModal}
                className="w-10 h-10 rounded-2xl border flex items-center justify-center hover:bg-gray-50 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <div>
                      <label className="text-sm font-semibold text-gray-700">
                        Assigned Barangay
                      </label>

                      <div className="mt-2 flex items-center gap-3 border rounded-2xl px-4 py-3 bg-gray-50 focus-within:border-green-500">
                        <Home size={18} className="text-gray-400" />

                        <select
                          name="barangay"
                          value={formData.barangay}
                          onChange={handleBarangayChange}
                          className="w-full bg-transparent outline-none text-sm text-gray-800"
                        >
                          <option value="">Select barangay</option>

                          {barangayLocations.map((item) => (
                            <option
                              key={item.id || item.barangay}
                              value={item.barangay}
                            >
                              {item.barangay}
                            </option>
                          ))}
                        </select>
                      </div>

                      {barangayLocations.length === 0 && (
                        <p className="text-xs text-red-600 mt-2">
                          No barangay locations found. Please add barangays in
                          the barangay_locations table.
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2 bg-gray-50 border rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-green-700 mt-0.5" />

                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            Saved Barangay Coordinates
                          </p>

                          {formData.barangay ? (
                            <p className="text-sm text-gray-600 mt-1">
                              {selectedBarangayLocation ? (
                                <>
                                  Latitude:{" "}
                                  <span className="font-semibold">
                                    {selectedBarangayLocation.latitude ?? "N/A"}
                                  </span>{" "}
                                  • Longitude:{" "}
                                  <span className="font-semibold">
                                    {selectedBarangayLocation.longitude ?? "N/A"}
                                  </span>
                                </>
                              ) : (
                                "No saved coordinates found for this barangay."
                              )}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">
                              Select a barangay to view its saved latitude and
                              longitude.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
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
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-sm font-semibold text-blue-800">
                  Barangay map location
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Barangay coordinates are loaded from the barangay_locations
                  table. To update a barangay marker location, edit the
                  latitude and longitude in that table instead of entering them
                  manually here.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAddUserModal}
                  disabled={saving}
                  className="px-5 py-3 rounded-2xl border text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-3 rounded-2xl bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition disabled:opacity-60"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Account Terms and Confirmation
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Review and confirm the terms before saving this user profile.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
                className="w-10 h-10 rounded-2xl border flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-60"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4">
                <p className="text-sm font-bold text-yellow-900">
                  Terms and Account Authorization
                </p>

                <p className="text-sm text-yellow-800 leading-relaxed mt-2">
                  By creating this user profile, the LGU Admin confirms that the
                  provided email address, assigned role, barangay assignment,
                  contact information, and account status are correct and
                  authorized for use in SWRaCMS.
                </p>

                <p className="text-xs text-yellow-700 leading-relaxed mt-2">
                  This account may access system features depending on its
                  assigned role. The LGU Admin is responsible for verifying the
                  user information before saving the profile.
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <ConfirmRow label="Full Name" value={formData.full_name} />
                <ConfirmRow label="Email" value={formData.email} />
                <ConfirmRow label="Role" value={formatRole(formData.role)} />
                <ConfirmRow
                  label="Barangay"
                  value={
                    formData.role === "barangay_user" ? formData.barangay : "—"
                  }
                />
                <ConfirmRow
                  label="Contact Number"
                  value={formData.contact_number || "No contact number"}
                />
                <ConfirmRow
                  label="Status"
                  value={formatStatus(formData.status)}
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer border rounded-2xl p-4 bg-green-50 border-green-100">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-green-700"
                />

                <span className="text-sm text-green-900 font-semibold leading-relaxed">
                  I confirm that the details are correct and I agree to create or update this
                  user profile.
                </span>
              </label>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={saving}
                className="px-5 py-3 rounded-2xl border text-sm font-semibold hover:bg-white transition disabled:opacity-60"
              >
                Back
              </button>

              <button
                type="button"
                onClick={confirmCreateUser}
                disabled={saving || !agreedToTerms}
                className="px-5 py-3 rounded-2xl bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Agree and Create User"}
              </button>
            </div>
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

function ConfirmRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border rounded-2xl px-4 py-3 bg-gray-50">
      <p className="text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900 text-right break-all">
        {value || "N/A"}
      </p>
    </div>
  );
}

function RoleBadge({ role }) {
  const label = formatRole(role);

  return (
    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
      {label}
    </span>
  );
}

function StatusBadge({ status }) {
  const currentStatus = status || "pending";

  const style =
    currentStatus === "active"
      ? "bg-green-100 text-green-700"
      : currentStatus === "pending"
        ? "bg-yellow-100 text-yellow-700"
        : currentStatus === "rejected"
          ? "bg-red-100 text-red-700"
          : currentStatus === "disabled"
            ? "bg-gray-100 text-gray-700"
            : "bg-gray-100 text-gray-700";

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style}`}>
      {formatStatus(currentStatus)}
    </span>
  );
}

function formatRole(role) {
  if (role === "lgu_admin") return "LGU Admin";
  if (role === "barangay_user") return "Barangay User";
  if (role === "collection_staff") return "Collection Staff";

  return role || "Unknown";
}

function formatStatus(status) {
  if (status === "active") return "Active";
  if (status === "pending") return "Pending";
  if (status === "rejected") return "Rejected";
  if (status === "disabled") return "Disabled";

  return status || "Pending";
}

function formatDate(dateValue) {
  if (!dateValue) return "N/A";

  return new Date(dateValue).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}