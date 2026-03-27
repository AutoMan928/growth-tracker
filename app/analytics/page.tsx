"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { TrendingUp, CheckSquare, Timer, Briefcase, Trophy } from "lucide-react";

interface AnalyticsData {
  learning: {
    byDay: { date: string; minutes: number }[];
    bySubject: { subject: string; minutes: number }[];
    total: number;
  };
  habits: { completionRate: number; total: number; logs: number };
  mood: { date: string; mood: number }[];
  focus: { sessions: number; totalMinutes: number };
  work: { done: number; pending: number };
  achievements: { id: number; title: string; description: string; icon: string; unlockedAt: string | null }[];
}

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f97316"];

const MOOD_LABELS: Record<number, string> = { 1: "很差", 2: "较差", 3: "一般", 4: "较好", 5: "很好" };

// Default achievements (shown even if API returns empty)
const DEFAULT_ACHIEVEMENTS = [
  { id: 1, title: "初学者", description: "记录第一条学习记录", icon: "📚", unlockedAt: null },
  { id: 2, title: "水分充足", description: "连续7天完成饮水目标", icon: "💧", unlockedAt: null },
  { id: 3, title: "习惯养成", description: "某个习惯连续打卡7天", icon: "🔥", unlockedAt: null },
  { id: 4, title: "专注达人", description: "完成10个番茄钟", icon: "🍅", unlockedAt: null },
  { id: 5, title: "记录者", description: "连续7天写日记", icon: "✍️", unlockedAt: null },
  { id: 6, title: "目标实现", description: "完成第一个目标", icon: "🎯", unlockedAt: null },
  { id: 7, title: "任务专家", description: "完成20个工作任务", icon: "✅", unlockedAt: null },
  { id: 8, title: "坚持不懈", description: "某个习惯连续打卡30天", icon: "🏆", unlockedAt: null },
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const achievements = data?.achievements?.length ? data.achievements : DEFAULT_ACHIEVEMENTS;

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">数据分析</h1>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          {
            icon: CheckSquare, label: "习惯完成率",
            value: `${data?.habits.completionRate ?? 0}%`,
            sub: `共 ${data?.habits.total ?? 0} 个习惯`,
            color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20",
          },
          {
            icon: Timer, label: "总专注时长",
            value: `${Math.floor((data?.focus.totalMinutes ?? 0) / 60)}h`,
            sub: `${data?.focus.sessions ?? 0} 个番茄钟`,
            color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20",
          },
          {
            icon: Briefcase, label: "已完成任务",
            value: `${data?.work.done ?? 0}`,
            sub: `待办 ${data?.work.pending ?? 0} 个`,
            color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20",
          },
          {
            icon: TrendingUp, label: "学习总时长",
            value: `${Math.floor((data?.learning.total ?? 0) / 60)}h${(data?.learning.total ?? 0) % 60}m`,
            sub: "近30天",
            color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20",
          },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Learning bar chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 text-sm">每日学习时长（近30天）</h2>
          {(data?.learning.byDay.length ?? 0) === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">暂无数据</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.learning.byDay.slice(-14)} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={1} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Tooltip formatter={(v) => [`${v}分钟`, "时长"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Subject pie chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 text-sm">科目分布</h2>
          {(data?.learning.bySubject.length ?? 0) === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-slate-400">暂无数据</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={data?.learning.bySubject} dataKey="minutes" nameKey="subject"
                    cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={3}>
                    {data?.learning.bySubject.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v}分钟`]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {data?.learning.bySubject.map((item, i) => (
                  <div key={item.subject} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-600 dark:text-slate-400 truncate">{item.subject}</span>
                    <span className="text-slate-400 ml-auto">{item.minutes}m</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mood trend line chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 mb-5">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 text-sm">情绪趋势（近14天）</h2>
        {(data?.mood.length ?? 0) === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-slate-400">暂无情绪数据</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data?.mood.slice(-14)} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]}
                tickFormatter={(v: number) => MOOD_LABELS[v] ?? v}
                tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Tooltip
                formatter={(v) => [(MOOD_LABELS as Record<string, string>)[String(v)] ?? v, "情绪"]}
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Line type="monotone" dataKey="mood" stroke="#6366f1" strokeWidth={2.5}
                dot={{ fill: "#6366f1", r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Achievement wall */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={18} className="text-yellow-500" />
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">成就墙</h2>
          <span className="text-xs text-slate-400 ml-auto">
            {achievements.filter(a => a.unlockedAt).length} / {achievements.length} 已解锁
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {achievements.map(ach => (
            <div key={ach.id}
              className={cn("rounded-xl p-3 text-center border transition-all",
                ach.unlockedAt
                  ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700"
                  : "bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700 opacity-50 grayscale")}>
              <div className="text-2xl mb-1.5">{ach.icon}</div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{ach.title}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight">{ach.description}</p>
              {ach.unlockedAt && (
                <p className="text-xs text-indigo-500 mt-1">
                  {new Date(ach.unlockedAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
