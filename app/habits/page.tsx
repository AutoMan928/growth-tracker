"use client";

import { useEffect, useState } from "react";
import { Flame, Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, startOfDay } from "date-fns";

interface HabitLog {
  id: number;
  date: string;
  completed: boolean;
}

interface Habit {
  id: number;
  name: string;
  icon: string;
  color: string;
  todayCompleted: boolean;
  streak: number;
  logs: HabitLog[];
}

const EMOJI_OPTIONS = ["🌅", "💧", "🏃", "📚", "🧘", "💪", "🎯", "💡", "🎵", "🍎"];
const COLOR_OPTIONS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#22c55e", "#10b981", "#06b6d4", "#3b82f6",
];

function HeatmapCell({ filled, date }: { filled: boolean; date: Date }) {
  return (
    <div title={format(date, "yyyy-MM-dd")}
      className={cn("w-3 h-3 rounded-sm", filled ? "bg-indigo-500" : "bg-slate-100 dark:bg-slate-700")} />
  );
}

function HabitHeatmap({ logs }: { logs: HabitLog[] }) {
  const today = new Date();
  const logSet = new Set(logs.filter(l => l.completed).map(l => format(new Date(l.date), "yyyy-MM-dd")));

  // Build 13 weeks (91 days) grid
  const weeks: Date[][] = [];
  const startDay = subDays(today, 90);
  // Align to Sunday
  const alignedStart = subDays(startDay, startDay.getDay());

  let current = alignedStart;
  while (current <= today) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(current));
      current = new Date(current.getTime() + 86400000);
    }
    weeks.push(week);
  }

  const dayLabels = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        <div className="flex flex-col gap-1 mr-1">
          {dayLabels.map((d, i) => (
            <div key={i} className="w-3 h-3 flex items-center justify-center text-[9px] text-slate-400">{i % 2 === 1 ? d : ""}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isFuture = day > today;
              return (
                <HeatmapCell key={di} filled={!isFuture && logSet.has(dateStr)} date={day} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "🌅", color: "#6366f1" });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const fetchHabits = async () => {
    try {
      const res = await fetch("/api/habits");
      const json = await res.json();
      if (json.success) setHabits(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHabits(); }, []);

  const toggleHabit = async (habit: Habit) => {
    setToggling(habit.id);
    await fetch(`/api/habits/${habit.id}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !habit.todayCompleted }),
    });
    setToggling(null);
    fetchHabits();
  };

  const createHabit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowModal(false);
    setForm({ name: "", icon: "🌅", color: "#6366f1" });
    fetchHabits();
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">习惯打卡</h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus size={16} /> 新习惯
        </button>
      </div>

      {/* Habits grid */}
      {habits.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div className="text-4xl mb-3">🌱</div>
          <p className="text-slate-500 dark:text-slate-400 mb-4">还没有习惯，创建第一个吧！</p>
          <button onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl">
            <Plus size={16} /> 创建习惯
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {habits.map(habit => (
            <button key={habit.id}
              onClick={() => { setSelectedHabit(habit); toggleHabit(habit); }}
              disabled={toggling === habit.id}
              className={cn(
                "relative text-left rounded-2xl p-4 border transition-all duration-200",
                habit.todayCompleted
                  ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700"
                  : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-600"
              )}>
              {habit.todayCompleted && (
                <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
              <div className="text-3xl mb-2">{habit.icon}</div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm leading-tight">{habit.name}</p>
              <div className="flex items-center gap-1 mt-2">
                <Flame size={13} className="text-orange-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400">{habit.streak} 天连续</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Heatmaps */}
      {habits.length > 0 && (
        <div className="space-y-4">
          {habits.map(habit => (
            <div key={habit.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{habit.icon}</span>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{habit.name}</h3>
                <div className="flex items-center gap-1 ml-auto">
                  <Flame size={13} className="text-orange-400" />
                  <span className="text-xs text-slate-500">{habit.streak} 天</span>
                </div>
              </div>
              <HabitHeatmap logs={habit.logs} />
            </div>
          ))}
        </div>
      )}

      {/* New habit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">新建习惯</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1.5">习惯名称</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="例如：每日运动"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1.5">选择图标</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(em => (
                    <button key={em} onClick={() => setForm(f => ({ ...f, icon: em }))}
                      className={cn("w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all",
                        form.icon === em ? "bg-indigo-100 dark:bg-indigo-900/40 ring-2 ring-indigo-500" : "bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600")}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-1.5">选择颜色</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(color => (
                    <button key={color} onClick={() => setForm(f => ({ ...f, color }))}
                      className={cn("w-8 h-8 rounded-full border-2 transition-all",
                        form.color === color ? "border-slate-400 scale-110" : "border-transparent")}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                取消
              </button>
              <button onClick={createHabit} disabled={saving || !form.name.trim()}
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
