import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

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

async function getSchoolIdForTimetable(timetableId: string): Promise<string | null> {
  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    select: { schoolId: true },
  });
  return timetable?.schoolId ?? null;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { timetableId } = await params;

  const authResult = await authorizeWithSchool(request, "timetable:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const schoolId = await getSchoolIdForTimetable(timetableId);
  if (!schoolId) {
    return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
  }
  if (!hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const json = await request.json();
  const parsed = createSlotSchema.safeParse(json);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const period = await prisma.timetablePeriod.findUnique({
    where: { id: parsed.data.periodId },
    select: { id: true, timetableId: true },
  });
  if (!period || period.timetableId !== timetableId) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

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

  if (parsed.data.assessmentPlanId) {
    const plan = await prisma.assessmentPlan.findUnique({
      where: { id: parsed.data.assessmentPlanId },
      select: { classGroup: { select: { schoolId: true } } },
    });
    if (!plan || plan.classGroup.schoolId !== schoolId) {
      return NextResponse.json({ error: "Invalid assessment plan" }, { status: 400 });
    }
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

  const authResult = await authorizeWithSchool(_, "timetable:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const schoolId = await getSchoolIdForTimetable(timetableId);
  if (!schoolId) {
    return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
  }
  if (!hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }
  
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
