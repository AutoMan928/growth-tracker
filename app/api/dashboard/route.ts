import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Today's water intake
    const waterToday = await prisma.healthRecord.aggregate({
      where: {
        type: "water_intake",
        date: { gte: todayStart, lte: todayEnd },
      },
      _sum: { value: true },
    });

    // Today's habit completions
    const allHabits = await prisma.habit.findMany({ where: { isActive: true } });
    const todayLogs = await prisma.habitLog.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        completed: true,
      },
    });

    // Learning today
    const learningToday = await prisma.learningRecord.aggregate({
      where: { date: { gte: todayStart, lte: todayEnd } },
      _sum: { duration: true },
    });

    // Work tasks today
    const tasksDueToday = await prisma.workTask.count({
      where: {
        status: { not: "done" },
        OR: [
          { dueDate: { gte: todayStart, lte: todayEnd } },
          { priority: "urgent" },
        ],
      },
    });

    // Active goals
    const activeGoals = await prisma.goal.findMany({
      where: { status: "active" },
      orderBy: { updatedAt: "desc" },
      take: 3,
    });

    // Recent activity
    const recentLearning = await prisma.learningRecord.findMany({
      orderBy: { date: "desc" },
      take: 3,
    });

    // Focus sessions today
    const focusToday = await prisma.focusSession.aggregate({
      where: {
        completed: true,
        startTime: { gte: todayStart, lte: todayEnd },
      },
      _count: true,
      _sum: { duration: true },
    });

    // Weekly habit heatmap (last 7 days)
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekLogs = await prisma.habitLog.findMany({
      where: {
        date: { gte: weekStart, lte: todayEnd },
        completed: true,
      },
      include: { habit: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        waterToday: waterToday._sum.value ?? 0,
        habitsCompleted: todayLogs.length,
        habitsTotal: allHabits.length,
        learningMinutes: learningToday._sum.duration ?? 0,
        tasksDueToday,
        activeGoals,
        recentLearning,
        focusSessions: focusToday._count ?? 0,
        focusMinutes: focusToday._sum.duration ?? 0,
        weekLogs,
        habits: allHabits,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
