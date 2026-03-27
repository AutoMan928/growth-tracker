"use client";

import { useEffect, useState } from "react";
import { Plus, BookOpen } from "lucide-react";
import { cn, getMoodColor } from "@/lib/utils";
import { format, subDays, getDaysInMonth, startOfMonth, getDay } from "date-fns";

interface JournalEntry {
  id: number;
  type: string;
  mood: number;
  content: string;
  gratitude: string | null;
  tomorrow: string | null;
  date: string;
}

const MOOD_OPTIONS = [
  { value: 1, emoji: "😞", label: "很差" },
  { value: 2, emoji: "😕", label: "较差" },
  { value: 3, emoji: "😐", label: "一般" },
  { value: 4, emoji: "🙂", label: "较好" },
  { value: 5, emoji: "😄", label: "很好" },
];
const MOOD_EMOJI: Record<number, string> = { 1: "😞", 2: "😕", 3: "😐", 4: "🙂", 5: "😄" };
const MOOD_BG: Record<number, string> = {
  1: "bg-red-400", 2: "bg-orange-400", 3: "bg-yellow-400", 4: "bg-green-400", 5: "bg-emerald-500",
};

const TEMPLATES = [
  { key: "morning", label: "晨间日记", icon: "🌅" },
  { key: "evening", label: "夜间日记", icon: "🌙" },
  { key: "free", label: "自由模式", icon: "✍️" },
];

const emptyForm = { type: "morning", mood: 3, content: "", gratitude: "", tomorrow: "" };

function MonthCalendar({ entries }: { entries: JournalEntry[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = getDaysInMonth(today);
  const firstDay = getDay(startOfMonth(today));

  const moodMap: Record<string, number> = {};
  entries.forEach(e => {
    const d = new Date(e.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      moodMap[d.getDate()] = e.mood;
    }
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["日", "一", "二", "三", "四", "五", "六"].map(d => (
          <div key={d} className="text-center text-xs text-slate-400 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => (
          <div key={i} className="aspect-square flex flex-col items-center justify-center rounded-lg text-xs">
            {day ? (
              <>
                <span className={cn("text-xs text-slate-600 dark:text-slate-400", day === today.getDate() && "font-bold text-indigo-600")}>{day}</span>
                {moodMap[day] ? (
                  <div className={cn("w-2 h-2 rounded-full mt-0.5", MOOD_BG[moodMap[day]])} />
                ) : (
                  <div className="w-2 h-2 mt-0.5" />
                )}
              </>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchEntries = async () => {
    try {
      const res = await fetch("/api/journal?days=30");
      const json = await res.json();
      if (json.success) setEntries(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setSaving(true);
    await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    setSaving(false);
    fetchEntries();
  };

  const showGratitude = form.type !== "free";
  const showTomorrow = form.type !== "free";

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">日记</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Write form */}
        <div className="lg:col-span-2 space-y-4">
          {/* Template selector */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
            <div className="flex gap-2">
              {TEMPLATES.map(t => (
                <button key={t.key} onClick={() => setForm(f => ({ ...f, type: t.key }))}
                  className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                    form.type === t.key
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600")}>
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 space-y-4">
            {/* Mood */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2">今日心情</label>
              <div className="flex gap-2">
                {MOOD_OPTIONS.map(m => (
                  <button key={m.value} type="button" onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                    className={cn("flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-all",
                      form.mood === m.value
                        ? "bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-500"
                        : "bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600")}>
                    <span className="text-xl">{m.emoji}</span>
                    <span className="text-slate-600 dark:text-slate-400">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
                {form.type === "morning" ? "今日计划与感受" : form.type === "evening" ? "今日总结与反思" : "内容"}
              </label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="写下你的想法..." rows={4}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            </div>

            {/* Gratitude */}
            {showGratitude && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1.5">感恩清单</label>
                <textarea value={form.gratitude} onChange={e => setForm(f => ({ ...f, gratitude: e.target.value }))}
                  placeholder="今天值得感恩的事情..." rows={2}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              </div>
            )}

            {/* Tomorrow */}
            {showTomorrow && (
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1.5">
                  {form.type === "morning" ? "今日三件事" : "明日计划"}
                </label>
                <textarea value={form.tomorrow} onChange={e => setForm(f => ({ ...f, tomorrow: e.target.value }))}
                  placeholder="计划要做的事情..." rows={2}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              </div>
            )}

            <button type="submit" disabled={saving || !form.content.trim()}
              className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <Plus size={16} />
              {saving ? "保存中..." : "保存日记"}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Monthly calendar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 text-sm">
              {format(new Date(), "yyyy年M月")} 情绪日历
            </h3>
            <MonthCalendar entries={entries} />
            <div className="flex justify-center gap-3 mt-3">
              {[1, 3, 5].map(m => (
                <div key={m} className="flex items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-full", MOOD_BG[m])} />
                  <span className="text-xs text-slate-400">{MOOD_OPTIONS.find(o => o.value === m)?.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent entries */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 text-sm">最近日记</h3>
            {entries.length === 0 ? (
              <div className="text-center py-6">
                <BookOpen size={28} className="text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">还没有日记</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {entries.slice(0, 10).map(entry => (
                  <div key={entry.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{MOOD_EMOJI[entry.mood]}</span>
                      <span className="text-xs text-slate-400">{format(new Date(entry.date), "MM/dd HH:mm")}</span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {TEMPLATES.find(t => t.key === entry.type)?.icon}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{entry.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
