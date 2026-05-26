import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle,
  Clock,
  Trash2,
  CheckCheck,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../lib/supabase";

export default function NotificationsPage({ role, userId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!role && !userId) return;

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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, userId]);

  async function fetchNotifications() {
    if (!role && !userId) return;

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

    if (error) {
      console.error("Notifications page fetch error:", error);
      setNotifications([]);
      setLoading(false);
      return;
    }

    setNotifications(data || []);
    setLoading(false);
  }

  async function markAsRead(id) {
    if (!id) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error("Mark as read error:", error);
      return;
    }

    fetchNotifications();
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (error) {
      console.error("Mark all as read error:", error);
      return;
    }

    fetchNotifications();
  }

  async function deleteNotification(id) {
    if (!id) return;

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete notification error:", error);
      return;
    }

    fetchNotifications();
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const reminderCount = notifications.filter((n) =>
    isReminderType(n.type)
  ).length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
              <Bell size={26} />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold">
                Notifications
              </h3>

              <p className="text-sm text-gray-500 leading-relaxed">
                View system alerts, schedule reminders, segregation reminders,
                request updates, and collection activities.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center justify-center gap-2 bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-5 py-3 rounded-2xl font-semibold text-sm"
          >
            <CheckCheck size={17} />
            Mark all as read
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <SummaryBox label="Total Notifications" value={notifications.length} />
          <SummaryBox label="Unread" value={unreadCount} />
          <SummaryBox label="Reminders" value={reminderCount} />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="p-5 sm:p-6 border-b">
          <h3 className="text-lg sm:text-xl font-bold">Notification List</h3>

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
              className={`p-4 sm:p-5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 ${
                !item.is_read ? "bg-green-50" : "bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => markAsRead(item.id)}
                className="flex items-start gap-3 sm:gap-4 text-left flex-1 min-w-0"
              >
                <NotificationIcon item={item} />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-gray-900 break-words">
                      {item.title || "System Notification"}
                    </h4>

                    {!item.is_read && (
                      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    )}

                    {item.type && <TypeBadge type={item.type} />}
                  </div>

                  <p className="text-sm text-gray-600 mt-1 leading-relaxed break-words">
                    {item.message || "No message available."}
                  </p>

                  <p className="text-xs text-gray-400 mt-2">
                    {formatDateTime(item.created_at)}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => deleteNotification(item.id)}
                className="self-start lg:self-center text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
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

function NotificationIcon({ item }) {
  const reminder = isReminderType(item.type);

  if (reminder) {
    return (
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
        <AlertTriangle size={22} />
      </div>
    );
  }

  return (
    <div
      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 ${
        item.is_read
          ? "bg-gray-100 text-gray-500"
          : "bg-green-100 text-green-700"
      }`}
    >
      {item.is_read ? <CheckCircle size={22} /> : <Clock size={22} />}
    </div>
  );
}

function TypeBadge({ type }) {
  const label = formatType(type);

  const style = isReminderType(type)
    ? "bg-orange-100 text-orange-700"
    : "bg-gray-100 text-gray-600";

  return (
    <span className={`${style} text-xs px-2 py-1 rounded-full font-semibold`}>
      {label}
    </span>
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

function isReminderType(type) {
  const value = String(type || "").toLowerCase();

  return (
    value.includes("reminder") ||
    value.includes("schedule") ||
    value.includes("segregation")
  );
}

function formatType(type) {
  if (!type) return "Update";

  return String(type)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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