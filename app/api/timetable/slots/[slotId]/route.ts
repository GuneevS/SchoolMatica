import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

const slotUpdateSchema = z.object({
  classGroupId: z.string(),
  teacherId: z.string().optional().nullable(),
  room: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

async function getSchoolIdForSlot(slotId: string): Promise<string | null> {
  const slot = await prisma.timetableSlot.findUnique({
    where: { id: slotId },
    select: { timetable: { select: { schoolId: true } } },
  });
  return slot?.timetable.schoolId ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await params;

  const authResult = await authorizeWithSchool(request, "timetable:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const schoolId = await getSchoolIdForSlot(slotId);
  if (!schoolId) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }
  if (!hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = slotUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  try {
    const classGroup = await prisma.classGroup.findUnique({
      where: { id: parsed.data.classGroupId },
      select: { id: true, schoolId: true },
    });

    if (!classGroup || classGroup.schoolId !== schoolId) {
      return NextResponse.json({ error: "Invalid class" }, { status: 400 });
    }

    if (parsed.data.teacherId) {
      const teacher = await prisma.teacher.findUnique({
        where: { id: parsed.data.teacherId },
        select: { id: true, schoolId: true },
      });
      if (!teacher || teacher.schoolId !== schoolId) {
        return NextResponse.json({ error: "Invalid teacher" }, { status: 400 });
      }
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
        assessmentPlan: true,
      },
    });

    return NextResponse.json(slot);
  } catch (error) {
    console.error("Update slot error:", error);
    return NextResponse.json({ error: "Failed to update slot" }, { status: 500 });
  }
}
