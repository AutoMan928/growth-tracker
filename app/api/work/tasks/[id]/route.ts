import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { title, description, status, priority, dueDate, project, tags } = body;

  const task = await prisma.workTask.update({
    where: { id: parseInt(id) },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && {
        status,
        completedAt: status === "done" ? new Date() : null,
      }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(project !== undefined && { project }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
    },
  });
  return NextResponse.json({ success: true, data: task });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.workTask.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
