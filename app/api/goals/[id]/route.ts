import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const goal = await prisma.goal.update({
    where: { id: parseInt(id) },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.progress !== undefined && { progress: parseFloat(body.progress) }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.targetDate !== undefined && {
        targetDate: body.targetDate ? new Date(body.targetDate) : null,
      }),
      ...(body.milestones !== undefined && { milestones: JSON.stringify(body.milestones) }),
    },
  });
  return NextResponse.json({ success: true, data: goal });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.goal.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
