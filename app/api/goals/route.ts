import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "active";

  const goals = await prisma.goal.findMany({
    where: status === "all" ? {} : { status },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ success: true, data: goals });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, type, category, targetDate, milestones } = body;
  if (!title) return NextResponse.json({ success: false, error: "Title required" }, { status: 400 });

  const goal = await prisma.goal.create({
    data: {
      title,
      description: description ?? null,
      type: type ?? "short",
      category: category ?? "personal",
      targetDate: targetDate ? new Date(targetDate) : null,
      milestones: JSON.stringify(milestones ?? []),
    },
  });
  return NextResponse.json({ success: true, data: goal });
}
