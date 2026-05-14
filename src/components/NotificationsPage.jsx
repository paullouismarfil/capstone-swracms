import { useEffect, useState } from "react";
import { Bell, CheckCircle, Clock, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function NotificationsPage({ role, userId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel(`notifications-page-${role || userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [role, userId]);

  async function fetchNotifications() {
    setLoading(true);

    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId && role) {
      query = query.or(`user_id.eq.${userId},role.eq.${role}`);
    } else if (userId) {
      query = query.eq("user_id", userId);
    } else if (role) {
      query = query.eq("role", role);
    }

    const { data, error } = await query;

    if (!error) setNotifications(data || []);
    setLoading(false);
  }

  async function markAsRead(id) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchNotifications();
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    fetchNotifications();
  }

  async function deleteNotification(id) {
    await supabase.from("notifications").delete().eq("id", id);
    fetchNotifications();
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center">
              <Bell size={28} />
            </div>

            <div>
              <h3 className="text-2xl font-bold">Notifications</h3>
              <p className="text-sm text-gray-500">
                View system alerts, request updates, and collection activities.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={markAllAsRead}
            className="bg-green-700 text-white px-5 py-3 rounded-2xl font-semibold text-sm"
          >
            Mark all as read
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <SummaryBox label="Total Notifications" value={notifications.length} />
          <SummaryBox label="Unread" value={unreadCount} />
          <SummaryBox label="Role Target" value={role || "User"} />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold">Notification List</h3>
          <p className="text-sm text-gray-500">
            Click a notification to mark it as read.
          </p>
        </div>

        {loading && <div className="p-6 text-gray-500">Loading...</div>}

        {!loading && notifications.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Bell className="mx-auto mb-3 text-gray-300" size={44} />
            No notifications yet.
          </div>
        )}

        {!loading &&
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${
                !item.is_read ? "bg-green-50" : "bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => markAsRead(item.id)}
                className="flex items-start gap-4 text-left flex-1"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    item.is_read
                      ? "bg-gray-100 text-gray-500"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {item.is_read ? <CheckCircle size={22} /> : <Clock size={22} />}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-gray-900">{item.title}</h4>

                    {!item.is_read && (
                      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    )}

                    {item.type && (
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {item.type}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mt-1">{item.message}</p>

                  <p className="text-xs text-gray-400 mt-2">
                    {formatDateTime(item.created_at)}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => deleteNotification(item.id)}
                className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="bg-gray-50 border rounded-2xl p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <h4 className="text-2xl font-bold text-green-700 mt-1">{value}</h4>
    </div>
  );
}

function formatDateTime(dateValue) {
  if (!dateValue) return "N/A";

  return new Date(dateValue).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}