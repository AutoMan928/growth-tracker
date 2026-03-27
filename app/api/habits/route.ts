import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export async function GET() {
  const habits = await prisma.habit.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      logs: {
        where: { date: { gte: subDays(new Date(), 90) } },
        orderBy: { date: "desc" },
      },
    },
  });

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  const enriched = habits.map((habit) => {
    const todayLog = habit.logs.find(
      (l) => l.date >= todayStart && l.date <= todayEnd && l.completed
    );

    // Calculate streak
    let streak = 0;
    const logDates = new Set(
      habit.logs
        .filter((l) => l.completed)
        .map((l) => format(new Date(l.date), "yyyy-MM-dd"))
    );

    let checkDate = new Date(today);
    while (true) {
      const dateStr = format(checkDate, "yyyy-MM-dd");
      if (!logDates.has(dateStr)) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return { ...habit, todayCompleted: !!todayLog, streak };
  });

  return NextResponse.json({ success: true, data: enriched });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, icon, color, frequency, category } = body;
  if (!name) return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });

  const habit = await prisma.habit.create({
    data: { name, description: description ?? null, icon: icon ?? "⭐", color: color ?? "#6366f1", frequency: frequency ?? "daily", category: category ?? "general" },
  });
  return NextResponse.json({ success: true, data: habit });
}
