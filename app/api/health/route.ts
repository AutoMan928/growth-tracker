import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { subDays, startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const days = parseInt(searchParams.get("days") ?? "30");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (days) where.date = { gte: subDays(new Date(), days) };

  const records = await prisma.healthRecord.findMany({
    where,
    orderBy: { date: "desc" },
  });

  // Water today
  const today = new Date();
  const waterToday = await prisma.healthRecord.aggregate({
    where: {
      type: "water_intake",
      date: { gte: startOfDay(today), lte: endOfDay(today) },
    },
    _sum: { value: true },
  });

  return NextResponse.json({ success: true, data: records, waterToday: waterToday._sum.value ?? 0 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, value, unit, note, date } = body;

  if (!type || value === undefined || !unit) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  const record = await prisma.healthRecord.create({
    data: {
      type,
      value: parseFloat(value),
      unit,
      note: note ?? null,
      date: date ? new Date(date) : new Date(),
    },
  });

  return NextResponse.json({ success: true, data: record });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") ?? "0");
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  await prisma.healthRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
