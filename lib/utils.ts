import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, isYesterday, parseISO, startOfDay } from "date-fns";
import { zhCN } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isToday(d)) return "今天";
  if (isTomorrow(d)) return "明天";
  if (isYesterday(d)) return "昨天";
  return format(d, "MM月dd日", { locale: zhCN });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "MM/dd HH:mm", { locale: zhCN });
}

export function todayStart(): Date {
  return startOfDay(new Date());
}

export function toLocalDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function minutesToHours(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    urgent: "text-red-500",
    high: "text-orange-500",
    medium: "text-blue-500",
    low: "text-gray-400",
  };
  return map[priority] ?? "text-gray-400";
}

export function getPriorityBg(priority: string): string {
  const map: Record<string, string> = {
    urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };
  return map[priority] ?? "bg-gray-100 text-gray-600";
}

export function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = {
    urgent: "紧急",
    high: "高",
    medium: "中",
    low: "低",
  };
  return map[priority] ?? priority;
}

export function getMoodLabel(mood: number): string {
  const labels = ["", "😞 很差", "😕 较差", "😐 一般", "🙂 较好", "😄 很好"];
  return labels[mood] ?? "";
}

export function getMoodColor(mood: number): string {
  const colors = ["", "bg-red-100 text-red-700", "bg-orange-100 text-orange-700", "bg-yellow-100 text-yellow-700", "bg-green-100 text-green-700", "bg-emerald-100 text-emerald-700"];
  return colors[mood] ?? "";
}

export function success<T>(data: T) {
  return Response.json({ success: true, data });
}

export function error(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}
