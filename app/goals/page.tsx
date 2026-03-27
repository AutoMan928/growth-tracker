"use client";

import { useEffect, useState } from "react";
import { Plus, X, Target, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";

interface Goal {
  id: number;
  title: string;
  description: string | null;
  type: string;
  category: string;
  progress: number;
  status: string;
  targetDate: string | null;
  milestones: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  personal: "🌱", health: "❤️", learning: "📚", work: "💼", finance: "💰",
};
const CATEGORY_OPTIONS = [
  { value: "personal", label: "个人" },
  { value: "health", label: "健康" },
  { value: "learning", label: "学习" },
  { value: "work", label: "工作" },
  { value: "finance", label: "财务" },
];
const STATUS_TABS = [
  { key: "active", label: "进行中" },
  { key: "completed", label: "已完成" },
  { key: "abandoned", label: "已放弃" },
];
const emptyForm = { title: "", description: "", category: "personal", type: "short", targetDate: "" };

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("active");
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchGoals = async () => {
    try {
      const res = await fetch(`/api/goals?status=${statusTab}`);
      const json = await res.json();
      if (json.success) setGoals(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setLoading(true); fetchGoals(); }, [statusTab]);

  const createGoal = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, targetDate: form.targetDate || null }),
    });
    setForm(emptyForm);
    setShowModal(false);
    setSaving(false);
    fetchGoals();
  };

  const updateProgress = async (id: number, progress: number) => {
    await fetch(`/api/goals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    });
    setGoals(gs => gs.map(g => g.id === id ? { ...g, progress } : g));
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/goals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchGoals();
  };

  const saveEdit = async () => {
    if (!editingGoal) return;
    setSaving(true);
    await fetch(`/api/goals/${editingGoal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editingGoal.title,
        description: editingGoal.description,
        progress: editingGoal.progress,
        status: editingGoal.status,
        targetDate: editingGoal.targetDate || null,
      }),
    });
    setSaving(false);
    setEditingGoal(null);
    fetchGoals();
  };

  const daysLeft = (targetDate: string | null) => {
    if (!targetDate) return null;
    const d = differenceInDays(new Date(targetDate), new Date());
    if (d < 0) return <span className="text-red-500 text-xs">已过期 {Math.abs(d)} 天</span>;
    if (d === 0) return <span className="text-orange-500 text-xs">今天到期</span>;
    return <span className="text-slate-400 text-xs">还剩 {d} 天</span>;
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">我的目标</h1>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus size={16} /> 新建目标
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {STATUS_TABS.map(tab => (
          <button key={tab.key} onClick={() => setStatusTab(tab.key)}
            className={cn("px-4 py-1.5 text-sm font-medium rounded-lg transition-all",
              statusTab === tab.key
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}>
            {tab.label}
          </button>
        ))}
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
          <Target size={36} className="text-slate-200 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">暂无{STATUS_TABS.find(t => t.key === statusTab)?.label}目标</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(goal => {
            const isExpanded = expandedId === goal.id;
            return (
              <div key={goal.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl flex-shrink-0">{CATEGORY_ICONS[goal.category] ?? "🎯"}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{goal.description}</p>
                      )}
                    </div>
                    <button onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-500">进度</span>
                    <span className="text-sm font-medium text-indigo-600">{Math.round(goal.progress)}%</span>
                  </div>
                  <ProgressBar value={goal.progress} />
                  <div className="flex items-center justify-between mt-2">
                    {goal.targetDate && (
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {daysLeft(goal.targetDate)}
                      </div>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">{goal.type === "short" ? "短期" : "长期"}</span>
                  </div>
                </div>

                {/* Expanded edit */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/30 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-slate-500 block mb-1">进度调整</label>
                      <div className="flex items-center gap-3">
                        <input type="range" min={0} max={100} value={Math.round(goal.progress)}
                          onChange={e => updateProgress(goal.id, parseInt(e.target.value))}
                          className="flex-1 accent-indigo-500" />
                        <span className="text-sm font-medium text-indigo-600 w-10 text-right">{Math.round(goal.progress)}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {statusTab === "active" && (
                        <>
                          <button onClick={() => updateStatus(goal.id, "completed")}
                            className="flex-1 text-xs py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 font-medium">
                            标记完成
                          </button>
                          <button onClick={() => updateStatus(goal.id, "abandoned")}
                            className="flex-1 text-xs py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 font-medium">
                            放弃
                          </button>
                        </>
                      )}
                      {statusTab !== "active" && (
                        <button onClick={() => updateStatus(goal.id, "active")}
                          className="flex-1 text-xs py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 font-medium">
                          重新激活
                        </button>
                      )}
                      <button onClick={() => setEditingGoal({ ...goal })}
                        className="flex-1 text-xs py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 font-medium">
                        编辑
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">新建目标</h2>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="目标标题" className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="目标描述" rows={2} className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              <div className="flex gap-2">
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
                  {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
                  <option value="short">短期</option>
                  <option value="long">长期</option>
                </select>
              </div>
              <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none" />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                取消
              </button>
              <button onClick={createGoal} disabled={saving || !form.title.trim()}
                className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? "创建中..." : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">编辑目标</h2>
              <button onClick={() => setEditingGoal(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={editingGoal.title} onChange={e => setEditingGoal(g => g && ({ ...g, title: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <textarea value={editingGoal.description ?? ""} onChange={e => setEditingGoal(g => g && ({ ...g, description: e.target.value }))}
                rows={2} className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">进度: {Math.round(editingGoal.progress)}%</label>
                <input type="range" min={0} max={100} value={Math.round(editingGoal.progress)}
                  onChange={e => setEditingGoal(g => g && ({ ...g, progress: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-500" />
              </div>
              <input type="date" value={editingGoal.targetDate ? format(new Date(editingGoal.targetDate), "yyyy-MM-dd") : ""}
                onChange={e => setEditingGoal(g => g && ({ ...g, targetDate: e.target.value || null }))}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none" />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditingGoal(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-medium">
                取消
              </button>
              <button onClick={saveEdit} disabled={saving}
                className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
