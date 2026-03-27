import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "成长追踪 - 个人成长记录",
  description: "本地优先的个人成长追踪应用",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full" suppressHydrationWarning>
      <body className="h-full flex overflow-hidden bg-slate-50 dark:bg-slate-900">
        <SessionProvider>
          <Sidebar />
          <main className="flex-1 flex flex-col overflow-hidden">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
