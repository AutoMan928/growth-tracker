import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

export async function GET() {
  const now = new Date();
  const days30 = subDays(now, 30);

  // Learning stats last 30 days
  const learningRecords = await prisma.learningRecord.findMany({
    where: { date: { gte: days30 } },
    orderBy: { date: "asc" },
  });

  // Daily learning chart data
  const learningByDay: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = subDays(now, 29 - i);
    learningByDay[format(d, "MM/dd")] = 0;
  }
  learningRecords.forEach((r) => {
    const key = format(new Date(r.date), "MM/dd");
    if (key in learningByDay) learningByDay[key] += r.duration;
  });

  // Subject distribution
  const subjectMap: Record<string, number> = {};
  learningRecords.forEach((r) => {
    subjectMap[r.subject] = (subjectMap[r.subject] ?? 0) + r.duration;
  });

  // Habit completion rate last 30 days
  const habits = await prisma.habit.findMany({ where: { isActive: true } });
  const habitLogs = await prisma.habitLog.findMany({
    where: { date: { gte: days30 }, completed: true },
  });

  const habitCompletionRate = habits.length
    ? Math.round((habitLogs.length / (habits.length * 30)) * 100)
    : 0;

  // Mood trend
  const journalEntries = await prisma.journalEntry.findMany({
    where: { date: { gte: days30 } },
    orderBy: { date: "asc" },
    select: { date: true, mood: true },
  });

  const moodByDay: { date: string; mood: number }[] = journalEntries.map((e) => ({
    date: format(new Date(e.date), "MM/dd"),
    mood: e.mood,
  }));

  // Focus stats
  const focusSessions = await prisma.focusSession.aggregate({
    where: { completed: true, startTime: { gte: days30 } },
    _count: true,
    _sum: { duration: true },
  });

  // Work task stats
  const tasksDone = await prisma.workTask.count({
    where: { status: "done", completedAt: { gte: days30 } },
  });
  const tasksPending = await prisma.workTask.count({ where: { status: "todo" } });

  // Achievements
  const achievements = await prisma.achievement.findMany({ orderBy: { id: "asc" } });

  return NextResponse.json({
    success: true,
    data: {
      learning: {
        byDay: Object.entries(learningByDay).map(([date, minutes]) => ({ date, minutes })),
        bySubject: Object.entries(subjectMap).map(([subject, minutes]) => ({ subject, minutes })),
        total: learningRecords.reduce((s, r) => s + r.duration, 0),
      },
      habits: { completionRate: habitCompletionRate, total: habits.length, logs: habitLogs.length },
      mood: moodByDay,
      focus: { sessions: focusSessions._count, totalMinutes: focusSessions._sum.duration ?? 0 },
      work: { done: tasksDone, pending: tasksPending },
      achievements,
    },
  });
}
