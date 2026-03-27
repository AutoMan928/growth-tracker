import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const reminder = await prisma.reminder.update({
    where: { id: parseInt(id) },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.message !== undefined && { message: body.message }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.schedule !== undefined && {
        schedule: typeof body.schedule === "string" ? body.schedule : JSON.stringify(body.schedule),
      }),
    },
  });
  return NextResponse.json({ success: true, data: reminder });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.reminder.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
