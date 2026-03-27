"use client";

import { Bell, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header({ title }: { title?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored ? stored === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle("dark", newDark);
    localStorage.setItem("theme", newDark ? "dark" : "light");
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </h1>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title={isDark ? "切换亮色" : "切换暗色"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
