"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Reminder {
  id: number;
  title: string;
  message: string;
  type: string;
  schedule: string;
  isActive: boolean;
  createdAt: string;
}

const PRESET_TYPES = [
  { type: "water", label: "喝水提醒", icon: "💧", description: "定时提醒自己补充水分", defaultSchedule: "30", defaultTitle: "该喝水了！", defaultMessage: "距离上次喝水已过去一段时间，记得补充水分～" },
  { type: "uric_acid", label: "尿酸管理", icon: "💊", description: "定期记录和管理尿酸水平", defaultSchedule: "09:00", defaultTitle: "尿酸记录提醒", defaultMessage: "今天记录了尿酸水平了吗？" },
  { type: "study", label: "学习提醒", icon: "📚", description: "每日学习打卡提醒", defaultSchedule: "20:00", defaultTitle: "每日学习时间", defaultMessage: "该学习了，完成今天的学习目标！" },
];

const TYPE_OPTIONS = [
  { value: "water", label: "喝水" },
  { value: "uric_acid", label: "尿酸管理" },
  { value: "study", label: "学习" },
  { value: "habit", label: "习惯" },
  { value: "work", label: "工作" },
  { value: "custom", label: "自定义" },
];

const emptyForm = { title: "", message: "", type: "custom", scheduleType: "interval", interval: "60", dailyTime: "09:00" };

function parseSchedule(schedule: string): string {
  try {
    const parsed = JSON.parse(schedule);
    if (parsed.interval) return `每 ${parsed.interval} 分钟`;
    if (parsed.time) return `每天 ${parsed.time}`;
  } catch {
    if (schedule.includes(":")) return `每天 ${schedule}`;
    const n = parseInt(schedule);
    if (!isNaN(n)) return `每 ${n} 分钟`;
  }
  return schedule;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unknown">("unknown");
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFiredRef = useRef<Record<number, number>>({});

  const fetchReminders = async () => {
    try {
      const res = await fetch("/api/reminders");
      const json = await res.json();
      if (json.success) setReminders(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
    if (typeof Notification !== "undefined") {
      setNotifPermission(Notification.permission);
    }
  }, []);

  // Client-side reminder engine
  useEffect(() => {
    checkIntervalRef.current = setInterval(() => {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      reminders.filter(r => r.isActive).forEach(r => {
        let shouldFire = false;
        try {
          let parsed: { interval?: number; time?: string } = {};
          try { parsed = JSON.parse(r.schedule); } catch {
            if (r.schedule.includes(":")) parsed = { time: r.schedule };
            else parsed = { interval: parseInt(r.schedule) };
          }
          if (parsed.interval) {
            const lastFired = lastFiredRef.current[r.id] ?? 0;
            const minutesSince = (Date.now() - lastFired) / 60000;
            if (minutesSince >= parsed.interval) shouldFire = true;
          } else if (parsed.time) {
            const [h, m] = parsed.time.split(":").map(Number);
            const targetMinutes = h * 60 + m;
            if (nowMinutes === targetMinutes) {
              const lastFired = lastFiredRef.current[r.id] ?? 0;
              const minutesSince = (Date.now() - lastFired) / 60000;
              if (minutesSince > 1) shouldFire = true;
            }
          }
        } catch {}
        if (shouldFire) {
          lastFiredRef.current[r.id] = Date.now();
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(r.title, { body: r.message, icon: "/favicon.ico" });
          }
        }
      });
    }, 60000);
    return () => { if (checkIntervalRef.current) clearInterval(checkIntervalRef.current); };
  }, [reminders]);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const toggleActive = async (reminder: Reminder) => {
    await fetch(`/api/reminders/${reminder.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !reminder.isActive }),
    });
    setReminders(rs => rs.map(r => r.id === reminder.id ? { ...r, isActive: !r.isActive } : r));
  };

  const createReminder = async (data?: Partial<typeof emptyForm & { title: string; message: string }>) => {
    const f = data ? { ...emptyForm, ...data } : form;
    if (!f.title.trim() || !f.message.trim()) return;
    setSaving(true);
    const schedule = (f as typeof emptyForm).scheduleType === "interval"
      ? JSON.stringify({ interval: parseInt((f as typeof emptyForm).interval) })
      : JSON.stringify({ time: (f as typeof emptyForm).dailyTime });
    await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: f.title, message: f.message, type: f.type, schedule }),
    });
    setForm(emptyForm);
    setShowModal(false);
    setSaving(false);
    fetchReminders();
  };

  const addPreset = (preset: typeof PRESET_TYPES[0]) => {
    const scheduleType = preset.defaultSchedule.includes(":") ? "daily" : "interval";
    createReminder({
      title: preset.defaultTitle,
      message: preset.defaultMessage,
      type: preset.type,
      scheduleType,
      interval: scheduleType === "interval" ? preset.defaultSchedule : "60",
      dailyTime: scheduleType === "daily" ? preset.defaultSchedule : "09:00",
    });
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">提醒管理</h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus size={16} /> 新建提醒
        </button>
      </div>

      {/* Notification permission */}
      {notifPermission !== "granted" && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">需要通知权限</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">授权后将在提醒时间发送系统通知</p>
          </div>
          <button onClick={requestPermission}
            className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            请求通知权限
          </button>
        </div>
      )}
      {notifPermission === "granted" && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-4 mb-5 flex items-center gap-2">
          <Check size={16} className="text-emerald-600" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">通知权限已授权</p>
        </div>
      )}

      {/* Preset types */}
      <div className="mb-5">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">快速添加</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_TYPES.map(preset => (
            <button key={preset.type} onClick={() => addPreset(preset)}
              className="text-left bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-600 hover:shadow-sm transition-all">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{preset.icon}</span>
                <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{preset.label}</span>
              </div>
              <p className="text-xs text-slate-400">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Reminders list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">所有提醒</h2>
        </div>
        {reminders.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={36} className="text-slate-200 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">还没有提醒，创建一个吧</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {reminders.map(reminder => (
              <div key={reminder.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{reminder.title}</span>
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">
                      {TYPE_OPTIONS.find(t => t.value === reminder.type)?.label ?? reminder.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{reminder.message}</p>
                  <p className="text-xs text-indigo-500 mt-0.5">{parseSchedule(reminder.schedule)}</p>
                </div>
                {/* Toggle switch */}
                <button onClick={() => toggleActive(reminder)}
                  className={cn("relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
                    reminder.isActive ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-600")}>
                  <span className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    reminder.isActive && "translate-x-5")} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">新建提醒</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="提醒标题" className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="提醒内容" rows={2}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
                {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={() => setForm(f => ({ ...f, scheduleType: "interval" }))}
                  className={cn("flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                    form.scheduleType === "interval"
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400")}>
                  间隔
                </button>
                <button onClick={() => setForm(f => ({ ...f, scheduleType: "daily" }))}
                  className={cn("flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                    form.scheduleType === "daily"
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400")}>
                  每日
                </button>
              </div>
              {form.scheduleType === "interval" ? (
                <div className="flex items-center gap-2">
                  <input type="number" value={form.interval} onChange={e => setForm(f => ({ ...f, interval: e.target.value }))}
                    min={1} className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  <span className="text-sm text-slate-500">分钟一次</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input type="time" value={form.dailyTime} onChange={e => setForm(f => ({ ...f, dailyTime: e.target.value }))}
                    className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none" />
                  <span className="text-sm text-slate-500">每天提醒</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                取消
              </button>
              <button onClick={() => createReminder()} disabled={saving || !form.title.trim() || !form.message.trim()}
                className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? "创建中..." : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
