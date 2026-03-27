"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Heart, CheckSquare, BookOpen, Briefcase,
  Target, PenLine, Timer, BarChart2, Bell, ChevronLeft, ChevronRight,
  LogOut, Settings,
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "仪表盘" },
  { href: "/health", icon: Heart, label: "健康管理" },
  { href: "/habits", icon: CheckSquare, label: "习惯追踪" },
  { href: "/learning", icon: BookOpen, label: "学习记录" },
  { href: "/work", icon: Briefcase, label: "工作计划" },
  { href: "/goals", icon: Target, label: "目标管理" },
  { href: "/journal", icon: PenLine, label: "日记反思" },
  { href: "/focus", icon: Timer, label: "专注计时" },
  { href: "/analytics", icon: BarChart2, label: "数据分析" },
  { href: "/reminders", icon: Bell, label: "提醒设置" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-screen bg-[#1e1b4b] dark:bg-[#0a0a1a] flex flex-col",
        "transition-all duration-300 ease-in-out flex-shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center px-4 py-5 border-b border-white/10",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-xl">🌱</span>
            <span className="text-white font-bold text-base tracking-tight">成长追踪</span>
          </div>
        )}
        {collapsed && <span className="text-2xl">🌱</span>}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg p-1 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg p-1 transition-colors mt-1"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-white/15 text-white"
                  : "text-indigo-200 hover:bg-white/10 hover:text-white",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/10 space-y-1">
        <Link
          href="/settings"
          title={collapsed ? "设置" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-indigo-300 hover:bg-white/10 hover:text-white transition-all",
            collapsed && "justify-center px-2"
          )}
        >
          <Settings size={16} />
          {!collapsed && <span>设置</span>}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "退出登录" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-indigo-300 hover:bg-white/10 hover:text-red-300 transition-all",
            collapsed && "justify-center px-2"
          )}
        >
          <LogOut size={16} />
          {!collapsed && <span>退出登录</span>}
        </button>
        {!collapsed && (
          <div className="text-xs text-indigo-500 px-3 pt-1">v1.0.0</div>
        )}
      </div>
    </aside>
  );
}
