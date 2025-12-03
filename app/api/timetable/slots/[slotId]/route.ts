import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const slotUpdateSchema = z.object({
  classGroupId: z.string(),
  teacherId: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await params;
  const json = await request.json();
  const parsed = slotUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    // Verify class exists
    const classGroup = await prisma.classGroup.findUnique({
        where: { id: parsed.data.classGroupId }
    });

    if (!classGroup) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const slot = await prisma.timetableSlot.update({
      where: { id: slotId },
      data: {
        classGroupId: parsed.data.classGroupId,
        teacherId: parsed.data.teacherId,
        room: parsed.data.room,
        notes: parsed.data.notes,
      },
      include: {
          classGroup: { include: { subject: true } },
          teacher: true,
          period: true,
          assessmentPlan: true
      }
    });

    return NextResponse.json(slot);
  } catch (error) {
    console.error("Update slot error:", error);
    return NextResponse.json({ error: "Failed to update slot" }, { status: 500 });
  }
}
