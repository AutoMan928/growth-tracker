import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const today = searchParams.get("today") === "true";

  const where = today
    ? { startTime: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) } }
    : {};

  const sessions = await prisma.focusSession.findMany({
    where,
    orderBy: { startTime: "desc" },
  });

  const stats = await prisma.focusSession.aggregate({
    where: { ...where, completed: true },
    _count: true,
    _sum: { duration: true },
  });

  return NextResponse.json({
    success: true,
    data: sessions,
    stats: { count: stats._count, totalMinutes: stats._sum.duration ?? 0 },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { planned, type, taskId, duration, completed, note } = body;

  const session = await prisma.focusSession.create({
    data: {
      planned: planned ?? 25,
      type: type ?? "pomodoro",
      taskId: taskId ?? null,
      duration: duration ?? null,
      completed: completed ?? false,
      note: note ?? null,
      endTime: completed ? new Date() : null,
    },
  });
  return NextResponse.json({ success: true, data: session });
}
