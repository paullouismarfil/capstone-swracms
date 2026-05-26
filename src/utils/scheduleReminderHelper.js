import { supabase } from "../lib/supabase";
import { findBarangaySchedule } from "../data/collectionSchedule";

export async function createBarangayScheduleReminder(profile) {
  if (!profile?.id || !profile?.barangay) return;

  const schedule = findBarangaySchedule(profile.barangay);

  if (!schedule) return;

  const reminderInfo = getReminderInfo(schedule);

  if (!reminderInfo.shouldRemind) return;

  const todayKey = getDateKey(new Date());

  const title =
    reminderInfo.reminderType === "today"
      ? "Collection Schedule Today"
      : "Upcoming Collection Schedule";

  const message =
    reminderInfo.reminderType === "today"
      ? `Your barangay has a MENRO waste collection schedule today (${schedule.time}). Please make sure that waste is properly segregated before pickup.`
      : `Your barangay has an upcoming MENRO waste collection schedule tomorrow (${schedule.time}). Please prepare and segregate waste before pickup.`;

  const type =
    reminderInfo.reminderType === "today"
      ? "schedule_reminder_today"
      : "schedule_reminder_tomorrow";

  const duplicateKey = `${profile.id}-${type}-${todayKey}`;

  const { data: existing, error: checkError } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", profile.id)
    .eq("type", type)
    .gte("created_at", `${todayKey}T00:00:00`)
    .lt("created_at", `${todayKey}T23:59:59`)
    .maybeSingle();

  if (checkError) {
    console.error("Schedule reminder check error:", checkError);
    return;
  }

  if (existing) return;

  const { error } = await supabase.from("notifications").insert([
    {
      user_id: profile.id,
      title,
      message,
      type,
      is_read: false,
    },
  ]);

  if (error) {
    console.error("Schedule reminder insert error:", error);
  }

  console.log("Schedule reminder checked:", duplicateKey);
}

function getReminderInfo(schedule) {
  const today = new Date();
  const tomorrow = new Date();

  tomorrow.setDate(today.getDate() + 1);

  const todayMatches = isScheduleDate(schedule.group, today);
  const tomorrowMatches = isScheduleDate(schedule.group, tomorrow);

  if (todayMatches) {
    return {
      shouldRemind: true,
      reminderType: "today",
    };
  }

  if (tomorrowMatches) {
    return {
      shouldRemind: true,
      reminderType: "tomorrow",
    };
  }

  return {
    shouldRemind: false,
    reminderType: null,
  };
}

function isScheduleDate(group, date) {
  if (!group || !date) return false;

  const normalizedGroup = String(group).toLowerCase();

  if (normalizedGroup.includes("special")) {
    return isSpecialPoblacionSchedule(date);
  }

  const parts = normalizedGroup.split(" ");

  if (parts.length < 2) return false;

  const weekText = parts[0];
  const dayText = parts[1];

  const targetWeek = getWeekNumberFromText(weekText);
  const targetDay = getDayNumberFromText(dayText);

  if (!targetWeek || targetDay === null) return false;

  const actualWeek = getWeekOfMonth(date);
  const actualDay = date.getDay();

  return actualWeek === targetWeek && actualDay === targetDay;
}

function isSpecialPoblacionSchedule(date) {
  const day = date.getDay();

  // Monday, Wednesday, Friday, Saturday
  // This covers the common Poblacion/UA special collection days in your schedule.
  return day === 1 || day === 3 || day === 5 || day === 6;
}

function getWeekNumberFromText(value) {
  const text = String(value || "").toLowerCase();

  if (text.includes("1st") || text.includes("first")) return 1;
  if (text.includes("2nd") || text.includes("second")) return 2;
  if (text.includes("3rd") || text.includes("third")) return 3;
  if (text.includes("4th") || text.includes("fourth")) return 4;

  return null;
}

function getDayNumberFromText(value) {
  const text = String(value || "").toLowerCase();

  const days = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  return days[text] ?? null;
}

function getWeekOfMonth(date) {
  const dayOfMonth = date.getDate();

  return Math.ceil(dayOfMonth / 7);
}

function getDateKey(date) {
  return date.toISOString().slice(0, 10);
}