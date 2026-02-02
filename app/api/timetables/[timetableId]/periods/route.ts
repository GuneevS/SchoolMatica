import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

interface Params {
  params: Promise<{ timetableId: string }>;
}

const createPeriodSchema = z.object({
  name: z.string(),
  periodNumber: z.number().min(1),
  startTime: z.string(),
  endTime: z.string(),
  dayOfWeek: z.number().min(0).max(6),
});

const updatePeriodSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  periodNumber: z.number().min(1).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
});

export async function POST(request: NextRequest, { params }: Params) {
  const authResult = await authorizeWithSchool(request, "timetable:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { timetableId } = await params;
  const json = await request.json();
  const parsed = createPeriodSchema.safeParse(json);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Verify timetable belongs to an accessible school
  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    select: { schoolId: true },
  });
  if (!timetable) {
    return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
  }
  if (!hasSchoolAccess(auth, timetable.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const period = await prisma.timetablePeriod.create({
    data: {
      ...parsed.data,
      timetableId,
    },
  });

  return NextResponse.json(period, { status: 201 });
}

export async function GET(request: NextRequest, { params }: Params) {
  const { timetableId } = await params;

  const authResult = await authorizeWithSchool(request, "timetable:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    select: { schoolId: true },
  });
  if (!timetable) {
    return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
  }
  if (!hasSchoolAccess(auth, timetable.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }
  
  const periods = await prisma.timetablePeriod.findMany({
    where: { timetableId },
    orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
    include: {
      slots: {
        include: {
          classGroup: { include: { subject: true } },
          teacher: true,
        },
      },
    },
  });

  return NextResponse.json(periods);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const authResult = await authorizeWithSchool(request, "timetable:update");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { timetableId } = await params;
  const json = await request.json();
  const parsed = updatePeriodSchema.safeParse(json);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    select: { schoolId: true },
  });
  if (!timetable) {
    return NextResponse.json({ error: "Timetable not found" }, { status: 404 });
  }
  if (!hasSchoolAccess(auth, timetable.schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  const existing = await prisma.timetablePeriod.findUnique({
    where: { id: parsed.data.id },
    select: { timetableId: true },
  });
  if (!existing || existing.timetableId !== timetableId) {
    return NextResponse.json({ error: "Period not found on this timetable" }, { status: 404 });
  }

  const { id, ...updateData } = parsed.data;
  const period = await prisma.timetablePeriod.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(period);
}
