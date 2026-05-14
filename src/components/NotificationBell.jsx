import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function NotificationBell({ role, userId }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel(`notification-bell-${role || userId}`)
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
    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (userId && role) {
      query = query.or(`user_id.eq.${userId},role.eq.${role}`);
    } else if (userId) {
      query = query.eq("user_id", userId);
    } else if (role) {
      query = query.eq("role", role);
    }

    const { data, error } = await query;
    if (!error) setNotifications(data || []);
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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative w-12 h-12 rounded-2xl bg-white shadow-sm border flex items-center justify-center"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-96 max-w-[90vw] bg-white border rounded-3xl shadow-2xl z-50 overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Notifications</h3>
              <p className="text-xs text-gray-500">Latest system updates.</p>
            </div>

            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-semibold text-green-700"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && (
              <div className="p-5 text-sm text-gray-500">
                No notifications yet.
              </div>
            )}

            {notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => markAsRead(item.id)}
                className={`w-full text-left p-5 border-b hover:bg-gray-50 ${
                  !item.is_read ? "bg-green-50" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-sm text-gray-900">
                      {item.title}
                    </p>

                    <p className="text-sm text-gray-600 mt-1">
                      {item.message}
                    </p>

                    <p className="text-xs text-gray-400 mt-2">
                      {formatDateTime(item.created_at)}
                    </p>
                  </div>

                  {!item.is_read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-green-600 mt-1"></span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateTime(dateValue) {
  if (!dateValue) return "";

  return new Date(dateValue).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}