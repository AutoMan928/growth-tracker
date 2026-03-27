"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, Star, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

interface LearningRecord {
  id: number;
  subject: string;
  content: string;
  duration: number;
  type: string;
  rating: number;
  date: string;
}

interface LearningData {
  data: LearningRecord[];
  stats: { totalMinutes: number; bySubject: Record<string, number> };
}

const SUBJECTS = ["数学", "英语", "编程", "阅读", "其他"];
const TYPE_OPTIONS = [
  { value: "study", label: "学习" },
  { value: "reading", label: "阅读" },
  { value: "practice", label: "练习" },
  { value: "course", label: "课程" },
];
const TYPE_LABEL: Record<string, string> = { study: "学习", reading: "阅读", practice: "练习", course: "课程" };

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => onChange?.(s)} className={cn(onChange ? "cursor-pointer" : "cursor-default")}>
          <Star size={16} className={cn(s <= value ? "text-yellow-400 fill-yellow-400" : "text-slate-300 dark:text-slate-600")} />
        </button>
      ))}
    </div>
  );
}

export default function LearningPage() {
  const [data, setData] = useState<LearningData | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ subject: "", content: "", duration: "", type: "study", rating: 3 });
  const [saving, setSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/learning?days=30");
      const json = await res.json();
      if (json.success) setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject || !form.content || !form.duration) return;
    setSaving(true);
    await fetch("/api/learning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ subject: "", content: "", duration: "", type: "study", rating: 3 });
    setSaving(false);
    fetchData();
  };

  // Build daily chart for last 7 days
  const buildChartData = () => {
    const map: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      map[format(subDays(new Date(), i), "MM/dd")] = 0;
    }
    (data?.data ?? []).forEach(r => {
      const key = format(new Date(r.date), "MM/dd");
      if (key in map) map[key] += r.duration;
    });
    return Object.entries(map).map(([date, minutes]) => ({ date, minutes }));
  };

  const records = data?.data ?? [];
  const stats = data?.stats;
  const weekMinutes = records
    .filter(r => new Date(r.date) >= subDays(new Date(), 7))
    .reduce((s, r) => s + r.duration, 0);
  const weekCount = records.filter(r => new Date(r.date) >= subDays(new Date(), 7)).length;
  const mostStudied = stats?.bySubject
    ? Object.entries(stats.bySubject).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
    : "—";

  const chartData = buildChartData();

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
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">学习记录</h1>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { icon: Clock, label: "本周时长", value: `${weekMinutes} 分钟`, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-900/20" },
          { icon: BookOpen, label: "本周记录", value: `${weekCount} 条`, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
          { icon: TrendingUp, label: "最多科目", value: mostStudied, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", bg)}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Add form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Plus size={18} className="text-indigo-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">添加学习记录</h2>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <input value={form.subject} onChange={e => { setForm(f => ({ ...f, subject: e.target.value })); setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="科目"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              {showSuggestions && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg overflow-hidden">
                  {SUBJECTS.filter(s => s.includes(form.subject) || form.subject === "").map(s => (
                    <button key={s} type="button" onMouseDown={() => { setForm(f => ({ ...f, subject: s })); setShowSuggestions(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="学习内容" rows={3}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            <div className="flex gap-2">
              <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                placeholder="时长(分钟)" min={1}
                className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
                {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">评分</span>
              <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
            </div>
            <button type="submit" disabled={saving || !form.subject || !form.content || !form.duration}
              className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? "保存中..." : "保存记录"}
            </button>
          </form>
        </div>

        {/* Bar chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-violet-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">近7天学习</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip formatter={(v) => [`${v}分钟`, "时长"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="minutes" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Records list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">学习记录</h2>
        {records.length === 0 ? (
          <div className="text-center py-10">
            <BookOpen size={36} className="text-slate-200 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">暂无学习记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map(r => (
              <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{r.subject}</span>
                    <span className="text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full">
                      {TYPE_LABEL[r.type] ?? r.type}
                    </span>
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full ml-auto">
                      {r.duration} 分钟
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{r.content}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <StarRating value={r.rating} />
                    <span className="text-xs text-slate-400">{format(new Date(r.date), "MM/dd HH:mm")}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
