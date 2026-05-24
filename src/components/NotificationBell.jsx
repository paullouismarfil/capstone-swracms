import { useEffect, useState } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function NotificationBell({ role, userId }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!role && !userId) return;

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

    if (error) {
      console.error("Notification fetch error:", error);
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
      console.error("Mark all read error:", error);
      return;
    }

    fetchNotifications();
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative w-12 h-12 rounded-2xl bg-white shadow-sm border flex items-center justify-center hover:bg-gray-50 transition"
      >
        <Bell size={20} className="text-gray-700" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-96 max-w-[90vw] bg-white border rounded-3xl shadow-2xl z-50 overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                Notifications
              </h3>

              <p className="text-xs text-gray-500">
                Latest waste collection updates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="w-9 h-9 rounded-xl border flex items-center justify-center text-green-700 hover:bg-green-50 transition"
                  title="Mark all as read"
                >
                  <CheckCheck size={17} />
                </button>
              )}

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-xl border flex items-center justify-center text-gray-500 hover:bg-gray-50 transition"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="p-5 text-sm text-gray-500">
                Loading notifications...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Bell size={22} className="text-gray-400" />
                </div>

                <p className="text-sm font-semibold text-gray-700">
                  No notifications yet
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  Updates will appear here once available.
                </p>
              </div>
            )}

            {!loading &&
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markAsRead(item.id)}
                  className={`w-full text-left p-5 border-b hover:bg-gray-50 transition ${
                    !item.is_read ? "bg-green-50" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm text-gray-900">
                        {item.title || "System Notification"}
                      </p>

                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {item.message || "No message available."}
                      </p>

                      <p className="text-xs text-gray-400 mt-2">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>

                    {!item.is_read && (
                      <span className="w-2.5 h-2.5 rounded-full bg-green-600 mt-1 shrink-0"></span>
                    )}
                  </div>
                </button>
              ))}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                Showing latest {notifications.length} notifications
              </p>
            </div>
          )}
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