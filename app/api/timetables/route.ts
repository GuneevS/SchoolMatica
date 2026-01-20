import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { authorizeWithSchool, hasSchoolAccess, isSystemAdmin, getUserSchoolIds } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(3),
  schoolId: z.string(),
  year: z.number().min(2000),
  term: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  cycleType: z.enum(["Weekly", "Rotating", "Custom"]).default("Weekly"),
  periodsPerDay: z.number().min(1).max(20).default(8),
});

export async function GET(request: NextRequest) {
  // Authorize the request
  const authResult = await authorizeWithSchool(request, "timetable:read");
  if ("error" in authResult) {
    return authResult.error;
  }
  const { auth } = authResult;

  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId");
  const year = searchParams.get("year");
  const term = searchParams.get("term");

  // Validate school access if schoolId is provided
  if (schoolId && !hasSchoolAccess(auth, schoolId)) {
    return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
  }

  // Build where clause based on user permissions
  const where: Prisma.TimetableWhereInput = {};
  if (isSystemAdmin(auth)) {
    if (schoolId) where.schoolId = schoolId;
  } else {
    const userSchoolIds = getUserSchoolIds(auth);
    where.schoolId = schoolId ?? { in: userSchoolIds };
  }
  if (year) where.year = parseInt(year);
  if (term) where.term = term;

  const timetables = await prisma.timetable.findMany({
    where,
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
      _count: {
        select: { periods: true, slots: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(timetables);
}

export async function POST(request: NextRequest) {
  try {
    // Authorize the request
    const authResult = await authorizeWithSchool(request, "timetable:create");
    if ("error" in authResult) {
      return authResult.error;
    }
    const { auth } = authResult;

    const json = await request.json();
    const parsed = createSchema.safeParse(json);

    if (!parsed.success) {
      console.error("Timetable validation failed:", parsed.error.issues);
      return NextResponse.json({ 
        error: "Validation failed", 
        details: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
      }, { status: 400 });
    }

    const { name, schoolId, year, term, startDate, endDate, cycleType } = parsed.data;

    // Verify user has access to this school
    if (!hasSchoolAccess(auth, schoolId)) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    const timetable = await prisma.timetable.create({
    data: {
      name,
      schoolId,
      year,
      term,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      cycleType,
      status: "Draft",
    },
    include: {
      school: true,
      periods: true,
      slots: true,
    },
  });

// Generate periods
const { periodsPerDay } = parsed.data;
const days = [0, 1, 2, 3, 4]; // Mon-Fri

const periodsData: Prisma.TimetablePeriodCreateManyInput[] = [];

days.forEach((dayOfW) => {
  for (let p = 1; p <= periodsPerDay; p++) {
    // Default timing: Start 08:00, 50m intervals + 10m breaks?
    // Simplified: Period 1 = 08:00 - 08:50
    // Period 2 = 09:00 - 09:50
    const startHour = 8 + (p - 1); // 8, 9, 10...
    const startStr = `${startHour.toString().padStart(2, '0')}:00`;
    const endStr = `${startHour.toString().padStart(2, '0')}:50`;

    periodsData.push({
      timetableId: timetable.id,
      name: `Period ${p}`,
      periodNumber: p,
      startTime: startStr,
      endTime: endStr,
      dayOfWeek: dayOfW,
    });
  }
});

await prisma.timetablePeriod.createMany({
  data: periodsData,
});

// Re-fetch to return complete object
const fullTimetable = await prisma.timetable.findUnique({
  where: { id: timetable.id },
  include: {
    school: true,
    periods: true,
    slots: true,
  },
});

return NextResponse.json(fullTimetable, { status: 201 });
  } catch (error) {
    console.error("Failed to create timetable:", error);
    return NextResponse.json({ 
      error: "Failed to create timetable", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
