import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { subDays } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");
  const subject = searchParams.get("subject");

  const where: Record<string, unknown> = {
    date: { gte: subDays(new Date(), days) },
  };
  if (subject) where.subject = subject;

  const records = await prisma.learningRecord.findMany({
    where,
    orderBy: { date: "desc" },
  });

  // Stats
  const totalMinutes = records.reduce((s, r) => s + r.duration, 0);
  const subjectMap: Record<string, number> = {};
  records.forEach((r) => {
    subjectMap[r.subject] = (subjectMap[r.subject] ?? 0) + r.duration;
  });

  return NextResponse.json({
    success: true,
    data: records,
    stats: { totalMinutes, bySubject: subjectMap },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { subject, content, duration, type, tags, rating, date } = body;

  if (!subject || !content || !duration) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  const record = await prisma.learningRecord.create({
    data: {
      subject,
      content,
      duration: parseInt(duration),
      type: type ?? "study",
      tags: JSON.stringify(tags ?? []),
      rating: rating ? parseInt(rating) : 3,
      date: date ? new Date(date) : new Date(),
    },
  });
  return NextResponse.json({ success: true, data: record });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") ?? "0");
  if (!id) return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
  await prisma.learningRecord.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
