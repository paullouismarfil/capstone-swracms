import { supabase } from "../lib/supabase";

export async function createNotification({
  userId = null,
  role = null,
  title,
  message,
  type = "info",
}) {
  const { error } = await supabase.from("notifications").insert([
    {
      user_id: userId,
      role,
      title,
      message,
      type,
      is_read: false,
    },
  ]);

  if (error) {
    console.error("Notification error:", error.message);
  }
}

export async function notifyRole(role, title, message, type = "info") {
  return createNotification({
    role,
    title,
    message,
    type,
  });
}

export async function notifyUser(userId, title, message, type = "info") {
  return createNotification({
    userId,
    title,
    message,
    type,
  });
}