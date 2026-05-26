import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, X, Volume2, VolumeX } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function NotificationBell({ role, userId }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [soundReady, setSoundReady] = useState(false);
  const [alarmActive, setAlarmActive] = useState(false);

  const previousUnreadIdsRef = useRef(new Set());
  const firstLoadRef = useRef(true);
  const audioContextRef = useRef(null);
  const alarmIntervalRef = useRef(null);

  useEffect(() => {
    function unlockSound() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;

        if (!AudioContext) return;

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }

        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume();
        }

        setSoundReady(true);
      } catch {
        setSoundReady(false);
      }
    }

    window.addEventListener("click", unlockSound, { once: true });

    return () => {
      window.removeEventListener("click", unlockSound);
      stopAlarm();
    };
  }, []);

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
        () => fetchNotifications(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, userId]);

  async function fetchNotifications(isRealtimeUpdate = false) {
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

    const latestNotifications = data || [];

    detectNewUnreadNotification(latestNotifications, isRealtimeUpdate);

    setNotifications(latestNotifications);
    setLoading(false);
  }

  function detectNewUnreadNotification(latestNotifications, isRealtimeUpdate) {
    const unreadNotifications = latestNotifications.filter(
      (item) => !item.is_read
    );

    const currentUnreadIds = new Set(
      unreadNotifications.map((item) => item.id)
    );

    if (firstLoadRef.current) {
      previousUnreadIdsRef.current = currentUnreadIds;
      firstLoadRef.current = false;

      const latestUnread = unreadNotifications[0];

      if (latestUnread && isRecentNotification(latestUnread.created_at)) {
        showNotificationAlert(latestUnread);
      }

      return;
    }

    const newUnread = unreadNotifications.find(
      (item) => !previousUnreadIdsRef.current.has(item.id)
    );

    previousUnreadIdsRef.current = currentUnreadIds;

    if (isRealtimeUpdate && newUnread) {
      showNotificationAlert(newUnread);
    }
  }

  function showNotificationAlert(notification) {
    setToast(notification);
    showBrowserNotification(notification);

    if (isReminderNotification(notification)) {
      startAlarm();
    } else {
      stopAlarm();
    }

    if (!isReminderNotification(notification)) {
      setTimeout(() => {
        setToast(null);
      }, 6000);
    }
  }

  function isReminderNotification(notification) {
    const type = String(notification?.type || "").toLowerCase();
    const title = String(notification?.title || "").toLowerCase();
    const message = String(notification?.message || "").toLowerCase();

    return (
      type.includes("reminder") ||
      type.includes("schedule_reminder") ||
      type.includes("segregation") ||
      title.includes("reminder") ||
      title.includes("schedule") ||
      title.includes("segregation") ||
      message.includes("segregate") ||
      message.includes("scheduled collection")
    );
  }

  function startAlarm() {
    stopAlarm();

    setAlarmActive(true);

    playAlarmPattern();

    alarmIntervalRef.current = setInterval(() => {
      playAlarmPattern();
    }, 1800);
  }

  function stopAlarm() {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }

    setAlarmActive(false);
  }

  function playAlarmPattern() {
    playBeep(880, 0);
    playBeep(980, 250);
    playBeep(880, 500);
  }

  function playBeep(frequency = 880, delay = 0) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      const audioContext = audioContextRef.current || new AudioContext();
      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(
          frequency,
          audioContext.currentTime
        );

        gainNode.gain.setValueAtTime(0.14, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.001,
          audioContext.currentTime + 0.25
        );

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.25);
      }, delay);
    } catch {
      // Browser may block sound until the user clicks the page.
    }
  }

  function showBrowserNotification(notification) {
    try {
      if (!("Notification" in window)) return;

      if (Notification.permission === "granted") {
        new Notification(notification.title || "SWRaCMS Notification", {
          body: notification.message || "You have a new system notification.",
          icon: "/favicon.ico",
        });
      }
    } catch {
      // Browser notification may be blocked depending on user settings.
    }
  }

  async function requestBrowserNotificationPermission() {
    try {
      if (!("Notification" in window)) {
        alert("Browser notifications are not supported on this browser.");
        return;
      }

      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }

      if (Notification.permission === "granted") {
        alert("Browser notification permission enabled.");
      } else {
        alert("Browser notification permission was not allowed.");
      }
    } catch {
      alert("Failed to request browser notification permission.");
    }
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

    stopAlarm();
    setToast(null);
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

    stopAlarm();
    setToast(null);
    fetchNotifications();
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const toastIsReminder = isReminderNotification(toast);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative w-12 h-12 rounded-2xl bg-white shadow-sm border flex items-center justify-center hover:bg-gray-50 transition ${
          unreadCount > 0 || alarmActive ? "animate-pulse" : ""
        }`}
      >
        <Bell
          size={20}
          className={alarmActive ? "text-red-600" : "text-gray-700"}
        />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] w-[380px] max-w-[92vw] bg-white rounded-3xl shadow-2xl overflow-hidden animate-[slideIn_0.25s_ease-out] ${
            toastIsReminder ? "border border-red-200" : "border border-green-200"
          }`}
        >
          <div className="p-4 flex items-start gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                toastIsReminder
                  ? "bg-red-100 text-red-700 animate-pulse"
                  : "bg-green-100 text-green-700"
              }`}
            >
              <Bell size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900">
                {toast.title || "New Notification"}
              </p>

              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                {toast.message || "You have a new system reminder."}
              </p>

              <p className="text-xs text-gray-400 mt-2">
                {formatDateTime(toast.created_at)}
              </p>

              {toastIsReminder && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={stopAlarm}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                  >
                    <VolumeX size={14} />
                    Stop Alarm
                  </button>

                  <button
                    type="button"
                    onClick={() => markAsRead(toast.id)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-700 text-white text-xs font-semibold hover:bg-green-800"
                  >
                    Mark as Read
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setToast(null);
                stopAlarm();
              }}
              className="w-8 h-8 rounded-xl border flex items-center justify-center text-gray-500 hover:bg-gray-50 shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          <div
            className={`h-1 ${
              toastIsReminder ? "bg-red-600" : "bg-green-600"
            }`}
          ></div>
        </div>
      )}

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
              <button
                type="button"
                onClick={requestBrowserNotificationPermission}
                className="w-9 h-9 rounded-xl border flex items-center justify-center text-blue-700 hover:bg-blue-50 transition"
                title="Enable browser notification"
              >
                <Volume2 size={17} />
              </button>

              {alarmActive && (
                <button
                  type="button"
                  onClick={stopAlarm}
                  className="w-9 h-9 rounded-xl border flex items-center justify-center text-red-700 hover:bg-red-50 transition"
                  title="Stop alarm"
                >
                  <VolumeX size={17} />
                </button>
              )}

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

          {!soundReady && (
            <div className="px-5 py-3 bg-yellow-50 border-b text-xs text-yellow-800">
              Click anywhere on the page once to enable reminder sound.
            </div>
          )}

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

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

function isRecentNotification(dateValue) {
  if (!dateValue) return false;

  const created = new Date(dateValue).getTime();
  const now = Date.now();

  return now - created <= 2 * 60 * 1000;
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