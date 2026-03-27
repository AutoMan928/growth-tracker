import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const tasks = await prisma.workTask.findMany({
    where: status ? { status } : {},
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ success: true, data: tasks });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, status, priority, dueDate, project, tags } = body;

  if (!title) return NextResponse.json({ success: false, error: "Title required" }, { status: 400 });

  const task = await prisma.workTask.create({
    data: {
      title,
      description: description ?? null,
      status: status ?? "todo",
      priority: priority ?? "medium",
      dueDate: dueDate ? new Date(dueDate) : null,
      project: project ?? null,
      tags: JSON.stringify(tags ?? []),
    },
  });
  return NextResponse.json({ success: true, data: task });
}
