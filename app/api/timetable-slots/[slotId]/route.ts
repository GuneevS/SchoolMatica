import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ slotId: string }>;
}

const updateSlotSchema = z.object({
  teacherId: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assessmentPlanId: z.string().optional().nullable(),
});

export async function PATCH(request: NextRequest, { params }: Params) {
  const { slotId } = await params;
  const json = await request.json();
  const parsed = updateSlotSchema.safeParse(json);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const slot = await prisma.timetableSlot.update({
    where: { id: slotId },
    data: parsed.data,
    include: {
      classGroup: { include: { subject: true } },
      teacher: true,
      period: true,
      assessmentPlan: true,
    },
  });

  return NextResponse.json(slot);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { slotId } = await params;
  
  await prisma.timetableSlot.delete({
    where: { id: slotId },
  });

  return NextResponse.json({ success: true });
}
