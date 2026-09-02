import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";
import { handleApiError } from "@/lib/api-error-handler";

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
  const authResult = await authorizeWithSchool(request, "timetable:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  try {
    const { timetableId } = await params;
    const json = await request.json();
    const parsed = createSlotSchema.safeParse(json);
    if (!parsed.success) {
      const errorMessage = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const timetable = await prisma.timetable.findUnique({ where: { id: timetableId }, select: { schoolId: true } });
    if (!timetable) {
      return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
    }
    if (!hasSchoolAccess(auth, timetable.schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    const period = await prisma.timetablePeriod.findUnique({ where: { id: parsed.data.periodId }, select: { timetableId: true } });
    if (!period || period.timetableId !== timetableId) {
      return NextResponse.json({ error: "Period not found on this timetable" }, { status: 400 });
    }

    const classGroup = await prisma.classGroup.findUnique({ where: { id: parsed.data.classGroupId }, select: { schoolId: true } });
    if (!classGroup || classGroup.schoolId !== timetable.schoolId) {
      return NextResponse.json({ error: "Class not found in this school" }, { status: 400 });
    }

    if (parsed.data.teacherId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: parsed.data.teacherId }, select: { schoolId: true } });
      if (!teacher || teacher.schoolId !== timetable.schoolId) {
        return NextResponse.json({ error: "Teacher not found in this school" }, { status: 400 });
      }
    }

    if (parsed.data.assessmentPlanId) {
      const plan = await prisma.assessmentPlan.findUnique({
        where: { id: parsed.data.assessmentPlanId },
        select: { classGroup: { select: { schoolId: true } } },
      });
      if (!plan || plan.classGroup.schoolId !== timetable.schoolId) {
        return NextResponse.json({ error: "Assessment plan not found in this school" }, { status: 400 });
      }
    }

    const slot = await prisma.timetableSlot.create({
      data: { ...parsed.data, timetableId },
      include: { classGroup: { include: { subject: true } }, teacher: true, period: true, assessmentPlan: true },
    });

    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    return handleApiError("POST timetables/[timetableId]/slots", error);
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  const { timetableId } = await params;

  const authResult = await authorizeWithSchool(request, "timetable:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  try {
    const timetable = await prisma.timetable.findUnique({ where: { id: timetableId }, select: { schoolId: true } });
    if (!timetable) {
      return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
    }
    if (!hasSchoolAccess(auth, timetable.schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }
    
    const slots = await prisma.timetableSlot.findMany({
      where: { timetableId },
      include: { classGroup: { include: { subject: true } }, teacher: true, period: true, assessmentPlan: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(slots);
  } catch (error) {
    return handleApiError("GET timetables/[timetableId]/slots", error);
  }
}
