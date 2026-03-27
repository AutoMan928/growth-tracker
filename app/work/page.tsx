"use client";

import { useEffect, useState } from "react";
import { Plus, X, Calendar, ChevronRight } from "lucide-react";
import { cn, getPriorityBg, getPriorityLabel } from "@/lib/utils";
import { format } from "date-fns";

interface WorkTask {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  project: string | null;
  completedAt: string | null;
}

const COLUMNS = [
  { key: "todo", label: "待办", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-700" },
  { key: "in_progress", label: "进行中", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { key: "done", label: "已完成", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
];

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "紧急" },
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

const emptyForm = { title: "", description: "", priority: "medium", dueDate: "", project: "" };

export default function WorkPage() {
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTask, setEditTask] = useState<WorkTask | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/work/tasks");
      const json = await res.json();
      if (json.success) setTasks(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const createTask = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/work/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dueDate: form.dueDate || null }),
    });
    setForm(emptyForm);
    setShowCreateModal(false);
    setSaving(false);
    fetchTasks();
  };

  const updateTask = async (id: number, patch: Partial<WorkTask>) => {
    await fetch(`/api/work/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    fetchTasks();
  };

  const saveEdit = async () => {
    if (!editTask) return;
    setSaving(true);
    await fetch(`/api/work/tasks/${editTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTask.title,
        description: editTask.description,
        status: editTask.status,
        priority: editTask.priority,
        dueDate: editTask.dueDate || null,
        project: editTask.project,
      }),
    });
    setSaving(false);
    setEditTask(null);
    fetchTasks();
  };

  const tasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-80 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">工作任务</h1>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus size={16} /> 新建任务
        </button>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-4 min-w-[700px] h-full pb-4">
          {COLUMNS.map(col => (
            <div key={col.key} className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className={cn("flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700", col.bg)}>
                <span className={cn("font-semibold text-sm", col.color)}>{col.label}</span>
                <span className="text-xs bg-white dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">
                  {tasksByStatus(col.key).length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {tasksByStatus(col.key).length === 0 && (
                  <div className="text-center py-8 text-slate-300 dark:text-slate-600 text-sm">暂无任务</div>
                )}
                {tasksByStatus(col.key).map(task => (
                  <div key={task.id}
                    className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setEditTask({ ...task })}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">{task.title}</p>
                      <ChevronRight size={14} className="text-slate-300 flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getPriorityBg(task.priority))}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar size={11} />
                          {format(new Date(task.dueDate), "MM/dd")}
                        </span>
                      )}
                      {task.project && (
                        <span className="text-xs text-slate-400 truncate max-w-[80px]">{task.project}</span>
                      )}
                    </div>
                    {/* Quick status buttons */}
                    <div className="flex gap-1 mt-2" onClick={e => e.stopPropagation()}>
                      {COLUMNS.filter(c => c.key !== task.status).map(c => (
                        <button key={c.key}
                          onClick={() => updateTask(task.id, { status: c.key })}
                          className="text-xs text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors py-0.5 px-1.5 rounded bg-slate-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">新建任务</h2>
              <button onClick={() => setShowCreateModal(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="任务标题" className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="描述(可选)" rows={2} className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              <div className="flex gap-2">
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
                  {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none" />
              </div>
              <input value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))}
                placeholder="项目(可选)" className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                取消
              </button>
              <button onClick={createTask} disabled={saving || !form.title.trim()}
                className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
                {saving ? "创建中..." : "创建"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">编辑任务</h2>
              <button onClick={() => setEditTask(null)}><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="space-y-3">
              <input value={editTask.title} onChange={e => setEditTask(t => t && ({ ...t, title: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <textarea value={editTask.description ?? ""} onChange={e => setEditTask(t => t && ({ ...t, description: e.target.value }))}
                rows={2} placeholder="描述"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
              <div className="flex gap-2">
                <select value={editTask.status} onChange={e => setEditTask(t => t && ({ ...t, status: e.target.value }))}
                  className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
                  {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
                <select value={editTask.priority} onChange={e => setEditTask(t => t && ({ ...t, priority: e.target.value }))}
                  className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none">
                  {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <input type="date" value={editTask.dueDate ? format(new Date(editTask.dueDate), "yyyy-MM-dd") : ""}
                  onChange={e => setEditTask(t => t && ({ ...t, dueDate: e.target.value || null }))}
                  className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none" />
                <input value={editTask.project ?? ""} onChange={e => setEditTask(t => t && ({ ...t, project: e.target.value }))}
                  placeholder="项目"
                  className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditTask(null)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
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
