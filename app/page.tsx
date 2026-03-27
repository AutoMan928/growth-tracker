"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import {
  Droplets, BookOpen, CheckSquare, Briefcase,
  Target, Timer, Flame, Plus,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardData {
  waterToday: number;
  habitsCompleted: number;
  habitsTotal: number;
  learningMinutes: number;
  tasksDueToday: number;
  activeGoals: Array<{ id: number; title: string; progress: number; category: string }>;
  recentLearning: Array<{ id: number; subject: string; duration: number; date: string }>;
  focusSessions: number;
  focusMinutes: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () =>
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); })
      .finally(() => setLoading(false));

  useEffect(() => { refresh(); }, []);

  const today = format(new Date(), "yyyy年M月d日 EEEE", { locale: zhCN });
  const waterPct = Math.min(100, ((data?.waterToday ?? 0) / 2000) * 100);

  const addWater = (ml: number) =>
    fetch("/api/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "water_intake", value: ml, unit: "ml" }),
    }).then(refresh);

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const categoryIcons: Record<string, string> = {
    health: "❤️", learning: "📚", work: "💼", personal: "🌱", finance: "💰",
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">仪表盘</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{today}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => addWater(250)}
            className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors"
          >
            <Droplets size={15} /> 喝水 +250ml
          </button>
          <Link href="/focus" className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors">
            <Timer size={15} /> 开始专注
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Droplets} label="今日饮水" value={`${data?.waterToday ?? 0}ml`} sub="目标 2000ml" color="text-cyan-600" bg="bg-cyan-50 dark:bg-cyan-900/20" />
        <StatCard icon={CheckSquare} label="习惯完成" value={`${data?.habitsCompleted ?? 0}/${data?.habitsTotal ?? 0}`} sub="今日打卡" color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-900/20" />
        <StatCard
          icon={BookOpen}
          label="学习时长"
          value={
            (data?.learningMinutes ?? 0) >= 60
              ? `${Math.floor((data?.learningMinutes ?? 0) / 60)}h${(data?.learningMinutes ?? 0) % 60}m`
              : `${data?.learningMinutes ?? 0}分钟`
          }
          sub="今日学习"
          color="text-violet-600"
          bg="bg-violet-50 dark:bg-violet-900/20"
        />
        <StatCard icon={Timer} label="专注番茄" value={`${data?.focusSessions ?? 0}个`} sub={`共${data?.focusMinutes ?? 0}分钟`} color="text-orange-600" bg="bg-orange-50 dark:bg-orange-900/20" />
      </div>

      {/* Water progress */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 mb-5 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplets size={18} className="text-cyan-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">今日饮水进度</span>
          </div>
          <span className="text-sm text-slate-500">{data?.waterToday ?? 0} / 2000 ml</span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-700"
            style={{ width: `${waterPct}%` }}
          />
        </div>
        <div className="flex gap-2 mt-3">
          {[150, 250, 500].map((ml) => (
            <button
              key={ml}
              onClick={() => addWater(ml)}
              className="text-xs bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              +{ml}ml
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Goals */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-indigo-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">近期目标</span>
            </div>
            <Link href="/goals" className="text-xs text-indigo-500 hover:text-indigo-700">查看全部</Link>
          </div>
          {(data?.activeGoals?.length ?? 0) === 0 ? (
            <Empty text="暂无进行中的目标" link="/goals" />
          ) : (
            <div className="space-y-3">
              {data?.activeGoals?.map((goal) => (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {categoryIcons[goal.category] ?? "🎯"} {goal.title}
                    </span>
                    <span className="text-xs text-slate-500">{Math.round(goal.progress)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${goal.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent learning */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-violet-500" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">最近学习</span>
            </div>
            <Link href="/learning" className="text-xs text-indigo-500 hover:text-indigo-700">查看全部</Link>
          </div>
          {(data?.recentLearning?.length ?? 0) === 0 ? (
            <Empty text="还没有学习记录" link="/learning" />
          ) : (
            <div className="space-y-1">
              {data?.recentLearning?.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{r.subject}</p>
                    <p className="text-xs text-slate-400">{format(new Date(r.date), "MM/dd HH:mm")}</p>
                  </div>
                  <span className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-1 rounded-lg">
                    {r.duration}分钟
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        {[
          { href: "/learning", icon: BookOpen, label: "记录学习", from: "from-violet-500", to: "to-purple-600" },
          { href: "/habits", icon: CheckSquare, label: "习惯打卡", from: "from-indigo-500", to: "to-blue-600" },
          { href: "/journal", icon: Flame, label: "写日记", from: "from-rose-500", to: "to-pink-600" },
          { href: "/work", icon: Briefcase, label: "工作任务", from: "from-amber-500", to: "to-orange-600" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={cn(
              "flex flex-col items-center gap-2 py-4 px-3 rounded-2xl text-white font-medium text-sm",
              "bg-gradient-to-br hover:scale-105 transition-transform",
              a.from, a.to
            )}
          >
            <a.icon size={22} />
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string; bg: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", bg)}>
        <Icon size={18} className={color} />
      </div>
      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function Empty({ text, link }: { text: string; link: string }) {
  return (
    <div className="text-center py-6">
      <p className="text-sm text-slate-400 mb-3">{text}</p>
      <Link href={link} className="inline-flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-700">
        <Plus size={14} /> 立即创建
      </Link>
    </div>
  );
}
