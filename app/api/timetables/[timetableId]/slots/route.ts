import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ timetableId: string }>;
}

const createSlotSchema = z.object({
  periodId: z.string(),
  classGroupId: z.string(),
  teacherId: z.string().optional(),
  room: z.string().optional(),
  notes: z.string().optional(),
  assessmentPlanId: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  const { timetableId } = await params;
  const json = await request.json();
  const parsed = createSlotSchema.safeParse(json);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const slot = await prisma.timetableSlot.create({
    data: {
      ...parsed.data,
      timetableId,
    },
    include: {
      classGroup: { include: { subject: true } },
      teacher: true,
      period: true,
      assessmentPlan: true,
    },
  });

  return NextResponse.json(slot, { status: 201 });
}

export async function GET(_: NextRequest, { params }: Params) {
  const { timetableId } = await params;
  
  const slots = await prisma.timetableSlot.findMany({
    where: { timetableId },
    include: {
      classGroup: { include: { subject: true } },
      teacher: true,
      period: true,
      assessmentPlan: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(slots);
}
