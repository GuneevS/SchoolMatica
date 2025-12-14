import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { authorizeWithSchool, hasSchoolAccess } from "@/lib/auth";

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

async function getSchoolIdForTimetable(timetableId: string): Promise<string | null> {
  const timetable = await prisma.timetable.findUnique({
    where: { id: timetableId },
    select: { schoolId: true },
  });
  return timetable?.schoolId ?? null;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { timetableId } = await params;

  const authResult = await authorizeWithSchool(request, "timetable:read");
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

export async function DELETE(request: NextRequest, { params }: Params) {
  const { timetableId } = await params;

  const authResult = await authorizeWithSchool(request, "timetable:delete");
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

  await prisma.timetable.delete({
    where: { id: timetableId },
  });

  return NextResponse.json({ success: true });
}
