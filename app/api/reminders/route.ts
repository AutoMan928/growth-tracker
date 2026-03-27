import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  const reminders = await prisma.reminder.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ success: true, data: reminders });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, message, type, schedule } = body;
  if (!title || !message || !schedule) {
    return NextResponse.json({ success: false, error: "Missing fields" }, { status: 400 });
  }

  const reminder = await prisma.reminder.create({
    data: {
      title,
      message,
      type: type ?? "custom",
      schedule: typeof schedule === "string" ? schedule : JSON.stringify(schedule),
    },
  });
  return NextResponse.json({ success: true, data: reminder });
}
