import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const habitId = parseInt(id);
  const body = await req.json().catch(() => ({}));
  const { date, completed = true, note } = body;

  const logDate = date ? new Date(date) : new Date();
  const dayStart = startOfDay(logDate);
  const dayEnd = endOfDay(logDate);

  // Check if log exists
  const existing = await prisma.habitLog.findFirst({
    where: { habitId, date: { gte: dayStart, lte: dayEnd } },
  });

  if (existing) {
    // Toggle
    const updated = await prisma.habitLog.update({
      where: { id: existing.id },
      data: { completed: !existing.completed },
    });
    return NextResponse.json({ success: true, data: updated });
  }

  const log = await prisma.habitLog.create({
    data: { habitId, date: logDate, completed, note: note ?? null },
  });
  return NextResponse.json({ success: true, data: log });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const habitId = parseInt(id);
  await prisma.habitLog.deleteMany({ where: { habitId } });
  await prisma.habit.delete({ where: { id: habitId } });
  return NextResponse.json({ success: true });
}
