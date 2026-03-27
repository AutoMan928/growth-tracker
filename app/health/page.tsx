"use client";

import { useEffect, useState } from "react";
import { Droplets, Scale, FlaskConical, Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface HealthRecord {
  id: number;
  type: string;
  value: number;
  unit: string;
  note: string | null;
  date: string;
}

interface HealthData {
  data: HealthRecord[];
  waterToday: number;
}

const WATER_GOAL = 2000;

function CircularProgress({ value, max, size = 160 }: { value: number; max: number; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, value / max);
  const offset = circumference * (1 - pct);
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor"
        className="text-slate-100 dark:text-slate-700" strokeWidth={12} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="url(#waterGrad)" strokeWidth={12}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.7s ease" }} />
      <defs>
        <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function getUricAcidZone(value: number, gender: "male" | "female") {
  if (gender === "male") {
    if (value < 420) return { label: "正常", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", dot: "bg-green-500" };
    if (value <= 480) return { label: "偏高", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", dot: "bg-yellow-500" };
    return { label: "过高", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" };
  } else {
    if (value < 360) return { label: "正常", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", dot: "bg-green-500" };
    if (value <= 420) return { label: "偏高", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", dot: "bg-yellow-500" };
    return { label: "过高", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", dot: "bg-red-500" };
  }
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uricValue, setUricValue] = useState("");
  const [uricGender, setUricGender] = useState<"male" | "female">("male");
  const [weightValue, setWeightValue] = useState("");
  const [weightNote, setWeightNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/health?days=7");
      const json = await res.json();
      if (json.success) setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const addWater = async (ml: number) => {
    await fetch("/api/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "water_intake", value: ml, unit: "ml" }),
    });
    fetchData();
  };

  const addUricAcid = async () => {
    if (!uricValue) return;
    setSaving(true);
    await fetch("/api/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "uric_acid", value: parseFloat(uricValue), unit: "μmol/L", note: uricGender }),
    });
    setUricValue("");
    setSaving(false);
    fetchData();
  };

  const addWeight = async () => {
    if (!weightValue) return;
    setSaving(true);
    await fetch("/api/health", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "weight", value: parseFloat(weightValue), unit: "kg", note: weightNote }),
    });
    setWeightValue("");
    setWeightNote("");
    setSaving(false);
    fetchData();
  };

  const waterToday = data?.waterToday ?? 0;
  const waterPct = Math.round((waterToday / WATER_GOAL) * 100);
  const waterRecords = (data?.data ?? []).filter(r => r.type === "water_intake");
  const weightRecords = (data?.data ?? []).filter(r => r.type === "weight").slice(0, 10);
  const uricRecords = (data?.data ?? []).filter(r => r.type === "uric_acid").slice(0, 5);

  const todayWaterTimeline = waterRecords.filter(r => {
    const d = new Date(r.date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-40 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">健康追踪</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Water intake */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Droplets size={18} className="text-cyan-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">今日饮水</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <CircularProgress value={waterToday} max={WATER_GOAL} size={150} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{waterToday}</span>
                <span className="text-xs text-slate-400">/ {WATER_GOAL} ml</span>
                <span className="text-sm font-medium text-cyan-500">{waterPct}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-3">快速添加</p>
              <div className="grid grid-cols-3 gap-2">
                {[150, 250, 500].map(ml => (
                  <button key={ml} onClick={() => addWater(ml)}
                    className="bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 rounded-xl py-2 text-sm font-medium transition-colors">
                    +{ml}ml
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input type="number" placeholder="自定义 ml" className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400" id="customWater" />
                <button onClick={() => {
                  const el = document.getElementById("customWater") as HTMLInputElement;
                  if (el?.value) { addWater(parseInt(el.value)); el.value = ""; }
                }} className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Uric acid */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical size={18} className="text-purple-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">尿酸记录</h2>
          </div>
          <div className="flex gap-2 mb-3">
            <input type="number" placeholder="尿酸值 μmol/L" value={uricValue} onChange={e => setUricValue(e.target.value)}
              className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <select value={uricGender} onChange={e => setUricGender(e.target.value as "male" | "female")}
              className="border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
            <button onClick={addUricAcid} disabled={saving}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              记录
            </button>
          </div>

          {/* Color zones */}
          <div className="space-y-1.5 mb-3">
            <div className="text-xs font-medium text-slate-500 mb-1">参考范围 ({uricGender === "male" ? "男性" : "女性"})</div>
            {uricGender === "male" ? (
              <>
                <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> <span className="text-slate-600 dark:text-slate-400">正常 &lt; 420 μmol/L</span></div>
                <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> <span className="text-slate-600 dark:text-slate-400">偏高 420–480 μmol/L</span></div>
                <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> <span className="text-slate-600 dark:text-slate-400">过高 &gt; 480 μmol/L</span></div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> <span className="text-slate-600 dark:text-slate-400">正常 &lt; 360 μmol/L</span></div>
                <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> <span className="text-slate-600 dark:text-slate-400">偏高 360–420 μmol/L</span></div>
                <div className="flex items-center gap-2 text-xs"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> <span className="text-slate-600 dark:text-slate-400">过高 &gt; 420 μmol/L</span></div>
              </>
            )}
          </div>

          {uricRecords.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-2">暂无尿酸记录</p>
          ) : (
            <div className="space-y-1">
              {uricRecords.map(r => {
                const gender = (r.note as "male" | "female") ?? "male";
                const zone = getUricAcidZone(r.value, gender);
                return (
                  <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-700 last:border-0">
                    <span className="text-sm text-slate-700 dark:text-slate-200">{r.value} μmol/L</span>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", zone.color)}>{zone.label}</span>
                      <span className="text-xs text-slate-400">{format(new Date(r.date), "MM/dd")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Weight */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Scale size={18} className="text-indigo-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">体重记录</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <input type="number" step="0.1" placeholder="体重 kg" value={weightValue} onChange={e => setWeightValue(e.target.value)}
              className="w-28 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <input placeholder="备注" value={weightNote} onChange={e => setWeightNote(e.target.value)}
              className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            <button onClick={addWeight} disabled={saving}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              记录
            </button>
          </div>
          {weightRecords.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">暂无体重记录</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left py-2 text-slate-500 font-medium">日期</th>
                    <th className="text-right py-2 text-slate-500 font-medium">体重</th>
                    <th className="text-right py-2 text-slate-500 font-medium">备注</th>
                  </tr>
                </thead>
                <tbody>
                  {weightRecords.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 dark:border-slate-700 last:border-0">
                      <td className="py-2 text-slate-600 dark:text-slate-400">{format(new Date(r.date), "MM/dd HH:mm")}</td>
                      <td className="py-2 text-right font-medium text-slate-800 dark:text-slate-100">{r.value} kg</td>
                      <td className="py-2 text-right text-slate-400">{r.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Today's water timeline */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-cyan-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200">今日饮水时间线</h2>
          </div>
          {todayWaterTimeline.length === 0 ? (
            <div className="text-center py-8">
              <Droplets size={36} className="text-slate-200 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">今天还没有饮水记录</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {[...todayWaterTimeline].reverse().map((r, i) => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    {i < todayWaterTimeline.length - 1 && <div className="w-px h-6 bg-slate-100 dark:bg-slate-700 mt-1" />}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{format(new Date(r.date), "HH:mm")}</span>
                    <span className="text-sm font-medium text-cyan-600">+{r.value} ml</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
