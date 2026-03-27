"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "work" | "short_break" | "long_break";

const MODES: Record<Mode, { label: string; minutes: number; color: string; bg: string }> = {
  work: { label: "专注", minutes: 25, color: "#6366f1", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
  short_break: { label: "短休息", minutes: 5, color: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  long_break: { label: "长休息", minutes: 15, color: "#06b6d4", bg: "bg-cyan-50 dark:bg-cyan-900/20" },
};

const CYCLE = [
  "work", "short_break", "work", "short_break",
  "work", "short_break", "work", "long_break",
] as Mode[];

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

interface TodayStats {
  count: number;
  totalMinutes: number;
}

export default function FocusPage() {
  const [cycleIndex, setCycleIndex] = useState(0);
  const mode: Mode = CYCLE[cycleIndex % CYCLE.length];
  const totalSeconds = MODES[mode].minutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [stats, setStats] = useState<TodayStats>({ count: 0, totalMinutes: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = async () => {
    const res = await fetch("/api/focus?today=true");
    const json = await res.json();
    if (json.success) setStats(json.stats);
  };

  useEffect(() => { fetchStats(); }, []);

  const postSession = useCallback(async (plannedMinutes: number) => {
    await fetch("/api/focus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planned: plannedMinutes, duration: plannedMinutes, completed: true, type: "pomodoro" }),
    });
    fetchStats();
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            playBeep();
            if (mode === "work") {
              postSession(MODES.work.minutes);
              setCompletedSessions(c => c + 1);
            }
            // Advance cycle
            setCycleIndex(ci => ci + 1);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode, postSession]);

  // Reset when mode changes
  useEffect(() => {
    setSecondsLeft(MODES[CYCLE[cycleIndex % CYCLE.length]].minutes * 60);
    setRunning(false);
  }, [cycleIndex]);

  const reset = () => {
    setRunning(false);
    setSecondsLeft(totalSeconds);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = (totalSeconds - secondsLeft) / totalSeconds;

  // SVG circle
  const size = 240;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - progress);
  const modeConfig = MODES[mode];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">专注计时</h1>

      <div className="flex flex-col items-center gap-6">
        {/* Mode label */}
        <div className="flex gap-2">
          {(["work", "short_break", "long_break"] as Mode[]).map(m => (
            <span key={m} className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              mode === m
                ? "text-white"
                : "text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700")}
              style={mode === m ? { backgroundColor: MODES[m].color } : {}}>
              {MODES[m].label}
            </span>
          ))}
        </div>

        {/* Session dots */}
        <div className="flex gap-2 items-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cn("w-3 h-3 rounded-full transition-all",
              i < (completedSessions % 4) ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700")} />
          ))}
          <span className="text-xs text-slate-400 ml-2">第 {Math.floor(completedSessions / 4) + 1} 轮</span>
        </div>

        {/* Timer circle */}
        <div className="relative">
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke="currentColor"
              className="text-slate-100 dark:text-slate-700"
              strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={modeConfig.color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tabular-nums text-slate-800 dark:text-slate-100">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-sm text-slate-400 mt-1">{modeConfig.label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button onClick={reset}
            className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors">
            <RotateCcw size={20} />
          </button>
          <button onClick={() => setRunning(r => !r)}
            className="w-16 h-16 rounded-2xl text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg"
            style={{ backgroundColor: modeConfig.color }}>
            {running ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>
          <button onClick={() => { setCycleIndex(ci => ci + 1); }}
            className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-colors text-xs font-medium">
            跳过
          </button>
        </div>

        {/* Today stats */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          {[
            { label: "今日番茄", value: `${stats.count} 个`, icon: "🍅" },
            { label: "专注时长", value: `${stats.totalMinutes} 分钟`, icon: "⏱️" },
            { label: "已完成轮", value: `${completedSessions} 次`, icon: "✅" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Info card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-3">
            <Timer size={16} className="text-indigo-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">番茄工作法</span>
          </div>
          <div className="space-y-2">
            {CYCLE.slice(0, 8).map((m, i) => (
              <div key={i} className={cn("flex items-center gap-2 text-xs", i === cycleIndex % CYCLE.length ? "opacity-100" : "opacity-40")}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ backgroundColor: MODES[m].color }}>
                  {i + 1}
                </div>
                <span className="text-slate-600 dark:text-slate-400">{MODES[m].label} — {MODES[m].minutes}分钟</span>
                {i === cycleIndex % CYCLE.length && <span className="text-indigo-500 font-medium ml-auto">当前</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
