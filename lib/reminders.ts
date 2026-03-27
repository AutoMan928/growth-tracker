export interface ReminderSchedule {
  type: "interval" | "daily" | "custom";
  intervalMinutes?: number;
  time?: string; // HH:mm
  activeHours?: [number, number];
  daysOfWeek?: number[];
}

export interface ReminderConfig {
  id: number;
  title: string;
  message: string;
  type: string;
  schedule: ReminderSchedule;
  isActive: boolean;
  lastFired?: string | null;
}

export function parseSchedule(raw: string): ReminderSchedule {
  try {
    return JSON.parse(raw);
  } catch {
    return { type: "interval", intervalMinutes: 90 };
  }
}

export function shouldFire(
  reminder: ReminderConfig,
  now: Date = new Date()
): boolean {
  const schedule = reminder.schedule;
  const hour = now.getHours();
  const minute = now.getMinutes();

  if (schedule.activeHours) {
    const [start, end] = schedule.activeHours;
    if (hour < start || hour >= end) return false;
  }

  if (schedule.daysOfWeek && !schedule.daysOfWeek.includes(now.getDay())) {
    return false;
  }

  if (schedule.type === "daily" && schedule.time) {
    const [h, m] = schedule.time.split(":").map(Number);
    return hour === h && minute === m;
  }

  if (schedule.type === "interval" && schedule.intervalMinutes) {
    const lastFired = reminder.lastFired ? new Date(reminder.lastFired) : null;
    if (!lastFired) return true;
    const elapsed = (now.getTime() - lastFired.getTime()) / 60000;
    return elapsed >= schedule.intervalMinutes;
  }

  return false;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function fireNotification(title: string, body: string) {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/icon-192.svg" });
}
