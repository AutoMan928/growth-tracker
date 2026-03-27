import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const entries = await prisma.journalEntry.findMany({
    where: { date: { gte: subDays(new Date(), days) } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ success: true, data: entries });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, mood, content, gratitude, tomorrow, tags, date } = body;
  if (!content) return NextResponse.json({ success: false, error: "Content required" }, { status: 400 });

  const entry = await prisma.journalEntry.create({
    data: {
      type: type ?? "evening",
      mood: mood ? parseInt(mood) : 3,
      content,
      gratitude: gratitude ?? null,
      tomorrow: tomorrow ?? null,
      tags: JSON.stringify(tags ?? []),
      date: date ? new Date(date) : new Date(),
    },
  });
  return NextResponse.json({ success: true, data: entry });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") ?? "0");
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  await prisma.journalEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
