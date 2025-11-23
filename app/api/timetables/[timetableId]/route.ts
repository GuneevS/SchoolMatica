import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface Params {
  params: Promise<{ timetableId: string }>;
}

const updateSchema = z.object({
  name: z.string().min(3).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(["Draft", "Active", "Archived"]).optional(),
  cycleType: z.enum(["Weekly", "Rotating", "Custom"]).optional(),
});

export async function GET(_: NextRequest, { params }: Params) {
  const { timetableId } = await params;
  
  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    include: {
      school: true,
      periods: {
        orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
      },
      slots: {
        include: {
          classGroup: { include: { subject: true } },
          teacher: true,
          period: true,
          assessmentPlan: true,
        },
      },
    },
  });

  if (!timetable) {
    return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
  }

  return NextResponse.json(timetable);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { timetableId } = await params;
  const json = await request.json();
  const parsed = updateSchema.safeParse(json);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { startDate, endDate, ...rest } = parsed.data;
  const updateData: Prisma.TimetableUpdateInput = { ...rest };
  if (startDate) updateData.startDate = new Date(startDate);
  if (endDate) updateData.endDate = new Date(endDate);

  const timetable = await prisma.timetable.update({
    where: { id: timetableId },
    data: updateData,
    include: {
      school: true,
      periods: true,
      slots: {
        include: {
          classGroup: { include: { subject: true } },
          teacher: true,
          period: true,
        },
      },
    },
  });

  return NextResponse.json(timetable);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { timetableId } = await params;
  
  await prisma.timetable.delete({
    where: { id: timetableId },
  });

  return NextResponse.json({ success: true });
}
