"use client";

import { useState } from "react";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setStatus("error");
      setMessage("两次输入的新密码不一致");
      return;
    }
    if (newPwd.length < 8) {
      setStatus("error");
      setMessage("新密码至少需要 8 位");
      return;
    }
    setStatus("loading");
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    }).then((r) => r.json());

    if (res.success) {
      setStatus("success");
      setMessage("密码已更新！");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } else {
      setStatus("error");
      setMessage(res.error ?? "修改失败，请重试");
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">设置</h1>

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-indigo-500" />
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">修改密码</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              当前密码
            </label>
            <input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              新密码 <span className="text-slate-400 font-normal">（至少 8 位）</span>
            </label>
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">
              确认新密码
            </label>
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {status === "success" && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-400">
              <CheckCircle size={15} /> {message}
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
              <AlertCircle size={15} /> {message}
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            {status === "loading" ? "保存中…" : "保存密码"}
          </button>
        </form>
      </div>
    </div>
  );
}
